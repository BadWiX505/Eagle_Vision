"""
Auto-Tracker
============
Background thread that reads the latest detection output and drives the PTZ
camera to keep the highest-confidence weapon detection centred in frame.

Algorithm: directional soft-step
  error  = bbox_centre - frame_centre
  if |error_x| > DEAD_ZONE_X  →  move camera X by ±SOFT_STEP degrees
  if |error_y| > DEAD_ZONE_Y  →  move camera Y by ±SOFT_STEP degrees
  Both axes are moved independently so diagonal targets are handled naturally.

Enabled / disabled via enable() / disable() to stay in sync with the
system mode (AUTO ↔ MANUAL).
"""

from __future__ import annotations

import threading
import time

# ── Geometry constants (must match mainpipe.py FRAME_W / FRAME_H) ─────────────
FRAME_W = 640
FRAME_H = 360

# ── Dead-zone: ignore errors smaller than this to prevent micro-oscillation ───
DEAD_ZONE_X = 30   # pixels (horizontal)
DEAD_ZONE_Y = 20   # pixels (vertical)

# ── Soft step: fixed nudge applied each tick when outside the dead-zone ───────
# Small enough to feel smooth; tweak upward (e.g. 3-5) for faster convergence.
SOFT_STEP = 2   # degrees per tick

# ── Return-to-default timeout ─────────────────────────────────────────────────
# If no weapon is detected for this many seconds, reset camera to home position.
RETURN_TO_DEFAULT_SECS = 8.0

# ── Tracking refresh rate ─────────────────────────────────────────────────────
UPDATE_INTERVAL = 0.15   # seconds (~6.5 Hz)

# ── Labels from non-weapon models that should be excluded ─────────────────────
# Rather than maintaining a weapon whitelist (Roboflow class names vary),
# we exclude known non-weapon labels from other detectors.
_EXCLUDE_LABELS = {"ball", "baseball", "bat", "person", "human"}


class AutoTracker:
    """
    PTZ auto-tracker — runs as a daemon thread.

    Usage::

        tracker = AutoTracker(pipeline, hw)
        tracker.enable()   # switch to AUTO → start tracking
        tracker.disable()  # switch to MANUAL → stop tracking
    """

    def __init__(self, pipeline, hw) -> None:
        """
        Parameters
        ----------
        pipeline : AsyncDetectionPipeline
            Shared pipeline whose `get_latest_metadata()` is called each tick.
        hw : HardwareController | None
            Hardware abstraction layer.  When *None* (no Arduino), tracking
            logic still runs but no serial commands are issued (dev mode).
        """
        self._pipeline = pipeline
        self._hw = hw

        self._enabled = False
        self._lock = threading.Lock()

        # Track whether we are currently locked onto a target so the status
        # can be queried externally (e.g. for the detection WS payload).
        self._locked_on = False

        # Timestamp of the last frame that contained a valid weapon detection.
        # Used to trigger the return-to-default timeout.
        self._last_seen: float = 0.0
        self._returned_to_default = True  # avoids repeating the reset command

        # Rail state tracked internally so we only send start/stop once.
        self._rail_running = False

        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    # ── Public interface ───────────────────────────────────────────────────────

    def enable(self) -> None:
        """Start tracking (called when mode → AUTO). Also starts the rail."""
        with self._lock:
            self._enabled = True
            self._last_seen = 0.0
            self._returned_to_default = True
        if self._hw is not None:
            self._hw.setModeAuto()
        self._start_rail()
        print("AutoTracker: enabled")

    def disable(self) -> None:
        """Stop tracking (called when mode → MANUAL). Also stops the rail."""
        with self._lock:
            self._enabled = False
            self._locked_on = False
            self._last_seen = 0.0
            self._returned_to_default = True
        if self._hw is not None:
            self._hw.setModeManual()
        self._stop_rail()
        print("AutoTracker: disabled")

    @property
    def enabled(self) -> bool:
        with self._lock:
            return self._enabled

    @property
    def locked_on(self) -> bool:
        """True when a weapon is currently being tracked this tick."""
        with self._lock:
            return self._locked_on

    # ── Rail helpers ──────────────────────────────────────────────────────────

    def _start_rail(self) -> None:
        """Start the rail if not already running."""
        with self._lock:
            if self._rail_running:
                return
            self._rail_running = True
        print("AutoTracker: starting rail")
        if self._hw is not None:
            self._hw.StartRail()
        else:
            print("AutoTracker [dev]: would call StartRail()")

    def _stop_rail(self) -> None:
        """Stop the rail if currently running."""
        with self._lock:
            if not self._rail_running:
                return
            self._rail_running = False
        print("AutoTracker: stopping rail")
        if self._hw is not None:
            self._hw.StopRail()
        else:
            print("AutoTracker [dev]: would call StopRail()")

    # ── Internal loop ──────────────────────────────────────────────────────────

    def _loop(self) -> None:
        while True:
            time.sleep(UPDATE_INTERVAL)

            with self._lock:
                if not self._enabled:
                    self._locked_on = False
                    continue

            metadata = self._pipeline.get_latest_metadata()

            # ── No weapon detected this tick ──────────────────────────────────
            no_detection = (
                metadata is None
                or metadata.alert_type != "weapon"
                or not metadata.bboxes
            )

            if no_detection:
                with self._lock:
                    self._locked_on = False
                    last_seen = self._last_seen
                    returned = self._returned_to_default

                # Return camera to default and restart rail once timeout elapses
                if last_seen > 0 and not returned:
                    if time.time() - last_seen >= RETURN_TO_DEFAULT_SECS:
                        print("AutoTracker: no detection for 8 s — returning to default")
                        if self._hw is not None:
                            self._hw.MoveCameraDefault()
                        else:
                            print("AutoTracker [dev]: would call MoveCameraDefault()")
                        self._start_rail()
                        with self._lock:
                            self._returned_to_default = True
                continue

            # ── Filter to non-excluded candidates ────────────────────────────
            candidates = [
                bb for bb in metadata.bboxes
                if bb.label.lower() not in _EXCLUDE_LABELS
            ]
            if not candidates:
                with self._lock:
                    self._locked_on = False
                continue

            target = max(candidates, key=lambda bb: bb.confidence)

            # ── Record that we saw a detection this tick ──────────────────────
            with self._lock:
                first_detection = self._returned_to_default  # True means rail was running
                self._last_seen = time.time()
                self._returned_to_default = False

            # Stop the rail the first time a weapon appears
            if first_detection:
                self._stop_rail()
            # ── Compute centre of the target bbox ─────────────────────────────
            cx = target.x + target.w / 2.0
            cy = target.y + target.h / 2.0

            # ── Error from frame centre ────────────────────────────────────────
            ex = cx - FRAME_W / 2.0
            ey = cy - FRAME_H / 2.0

            # ── Dead-zone check ────────────────────────────────────────────────
            if abs(ex) < DEAD_ZONE_X and abs(ey) < DEAD_ZONE_Y:
                # Target is centred enough — mark locked on but don't move
                with self._lock:
                    self._locked_on = True
                continue

            with self._lock:
                self._locked_on = True

            # ── Soft-step: nudge camera by a fixed degree in the error direction ─
            move_x = 0
            move_y = 0

            if abs(ex) >= DEAD_ZONE_X:
                move_x = SOFT_STEP if ex > 0 else -SOFT_STEP

            # Y axis: image Y increases downward, but servo tilt is inverted —
            # moving toward a target that is ABOVE centre (ey < 0) requires a
            # POSITIVE tilt increment, so we negate the error sign.
            if abs(ey) >= DEAD_ZONE_Y:
                move_y = -SOFT_STEP if ey > 0 else SOFT_STEP

            if self._hw is None:
                # Dev mode: log what would happen without touching hardware
                print(
                    f"AutoTracker [dev]: target=({cx:.0f},{cy:.0f}) "
                    f"err=({ex:+.0f},{ey:+.0f}) "
                    f"cmd=(X{move_x:+d}, Y{move_y:+d})"
                )
                continue

            if move_x != 0:
                self._hw.MoveCameraX(move_x)

            if move_y != 0:
                self._hw.MoveCameraY(move_y)
