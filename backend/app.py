import json
import sys
import threading
import time
import atexit

from flask import Flask, Response
from flask_cors import CORS
from flask_sock import Sock

from stream.camera import IntegratedCamera
from stream.pipeline import AsyncDetectionPipeline
from stream.adapter import StreamAdapter
from stream.autotracker import AutoTracker
from hardware.hardwareController import HardwareController

print(sys.executable)

app = Flask(__name__)
CORS(app)  # allow cross-origin requests from the Next.js dev server
sock = Sock(app)

# ---------------------------------------------------------------------------
# Hardware Controller (singleton — shared across all WS sessions)
# Gracefully disabled when Arduino is not connected (dev / no-hardware mode).
# ---------------------------------------------------------------------------
try:
    hw: HardwareController | None = HardwareController(port='auto')
except Exception as e:
    print(f"WARNING: HardwareController failed to initialise: {e}")
    hw = None

def _shutdown_hardware():
    if hw:
        hw.close()

atexit.register(_shutdown_hardware)

# ---------------------------------------------------------------------------
# Camera → zone mapping
# ---------------------------------------------------------------------------
CAMERA_CONFIG: dict[str, dict] = {
    "cam-001": {"zone": "zone-a"},
}
ACTIVE_CAMERA_ID = "cam-001"

# ---------------------------------------------------------------------------
# Build the pipeline once at startup
# ---------------------------------------------------------------------------
camera = IntegratedCamera(camera_index=2)
camera.open()

pipeline = AsyncDetectionPipeline(camera_source=camera.get_frame)
pipeline.start()

adapter = StreamAdapter(frame_source=pipeline.get_processed_frame, fps=30)
adapter.start()

# ---------------------------------------------------------------------------
# Auto-Tracker (disabled until frontend switches to AUTO mode)
# ---------------------------------------------------------------------------
auto_tracker = AutoTracker(pipeline=pipeline, hw=hw)

# ---------------------------------------------------------------------------
# Alert cooldown state (thread-safe)
# ---------------------------------------------------------------------------
_alert_lock = threading.Lock()
_alert_counter: int = 0
_alert_last_sent: dict[str, float] = {}
ALERT_COOLDOWN_SECS = 20


def _make_alert_id() -> str:
    global _alert_counter
    with _alert_lock:
        _alert_counter += 1
        return f"alt-live-{str(_alert_counter).zfill(3)}"


def _should_emit_alert(alert_type: str) -> bool:
    """Returns True and records the timestamp if the cooldown has elapsed."""
    now = time.time()
    with _alert_lock:
        if now - _alert_last_sent.get(alert_type, 0) >= ALERT_COOLDOWN_SECS:
            _alert_last_sent[alert_type] = now
            return True
    return False


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/api/stream/video_feed")
def video_feed():
    """MJPEG live stream endpoint."""
    return Response(
        adapter.stream_generator(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


@app.route("/api/health")
def health():
    """Simple health check."""
    return {"status": "ok", "streaming": adapter.running}


@sock.route("/api/ws")
def detection_ws(ws):
    """
    WebSocket endpoint — pushes detection metadata at ~10 Hz.

    Message schema:
    {
      "camera_id": "cam-001",
      "zone":      "zone-a",
      "timestamp": "2026-04-20T12:00:00Z",
      "bboxes": [{"x":…,"y":…,"w":…,"h":…,"label":"weapon","confidence":0.95}],
      "alert": {"id":…,"type":…,"severity":…,"message":…,"cameraId":…,"zone":…,
                "timestamp":…,"read":false} | null
    }
    """
    zone = CAMERA_CONFIG.get(ACTIVE_CAMERA_ID, {}).get("zone", "zone-a")

    while True:
        metadata = pipeline.get_latest_metadata()
        bboxes: list[dict] = []
        alert_payload = None

        if metadata is not None:
            # Serialize bboxes
            for bb in metadata.bboxes:
                bboxes.append(
                    {
                        "x": round(bb.x, 2),
                        "y": round(bb.y, 2),
                        "w": round(bb.w, 2),
                        "h": round(bb.h, 2),
                        "label": bb.label,
                        "confidence": round(bb.confidence, 3),
                    }
                )

            # Build alert payload if warranted and cooldown allows
            if metadata.alert_type is not None and _should_emit_alert(metadata.alert_type):
                ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                alert_payload = {
                    "id": _make_alert_id(),
                    "timestamp": ts,
                    "cameraId": ACTIVE_CAMERA_ID,
                    "zone": zone,
                    "type": metadata.alert_type,
                    "severity": metadata.alert_severity,
                    "message": metadata.alert_message,
                    "read": False,
                }

        message = {
            "camera_id": ACTIVE_CAMERA_ID,
            "zone": zone,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "bboxes": bboxes,
            "alert": alert_payload,
            # Real-time tracking status (no cooldown — fires every tick)
            "weapon_detected": metadata is not None and metadata.alert_type == "weapon",
            "tracker_locked": auto_tracker.locked_on,
        }

        try:
            ws.send(json.dumps(message))
        except Exception:
            break  # client disconnected — exit handler

        time.sleep(0.1)  # ~10 Hz


@sock.route("/api/ws/control")
def control_ws(ws):
    """
    WebSocket endpoint for manual hardware control commands.

    Accepted message schema (frontend → backend):
      { "type": "camera_move",    "axis": "x"|"y", "degree": <int> }
      { "type": "camera_reset" }
      { "type": "rail_start" }
      { "type": "rail_stop" }
      { "type": "rail_direction", "direction": "forward"|"backward" }
      { "type": "mode_change",    "mode": "AUTO"|"MANUAL" }

    ACK schema (backend → frontend):
      { "type": "ack", "command": "<type>", "pan": <int>, "tilt": <int>, "rail_running": <bool> }
      { "type": "error", "message": "<reason>" }
    """
    _rail_running = False  # local state per session — tracks motor state

    def send_ack(command: str):
        pan  = hw.current_pan  if hw else 90
        tilt = hw.current_tilt if hw else 110
        ws.send(json.dumps({
            "type":         "ack",
            "command":      command,
            "pan":          pan,
            "tilt":         tilt,
            "rail_running": _rail_running,
        }))

    def send_error(message: str):
        ws.send(json.dumps({"type": "error", "message": message}))

    while True:
        try:
            raw = ws.receive()
        except Exception:
            break  # client disconnected

        if raw is None:
            break

        try:
            msg: dict = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            send_error("Invalid JSON")
            continue

        cmd_type = msg.get("type")

        try:
            if cmd_type == "camera_move":
                axis   = msg.get("axis", "x")
                degree = int(msg.get("degree", 5))
                if axis == "x":
                    if hw:
                        hw.MoveCameraX(degree)
                elif axis == "y":
                    if hw:
                        hw.MoveCameraY(degree)
                else:
                    send_error(f"Unknown axis: {axis}")
                    continue
                send_ack("camera_move")

            elif cmd_type == "camera_reset":
                if hw:
                    hw.MoveCameraDefault()
                send_ack("camera_reset")

            elif cmd_type == "rail_direction":
                direction = msg.get("direction", "forward")
                if direction not in ("forward", "backward"):
                    send_error(f"Unknown direction: {direction}")
                    continue
                if hw:
                    hw.setRailDirection(direction)
                send_ack("rail_direction")

            elif cmd_type == "rail_start":
                if hw:
                    hw.StartRail()
                _rail_running = True
                send_ack("rail_start")

            elif cmd_type == "rail_stop":
                if hw:
                    hw.StopRail()
                _rail_running = False
                send_ack("rail_stop")

            elif cmd_type == "mode_change":
                new_mode = msg.get("mode", "MANUAL")
                if new_mode == "AUTO":
                    auto_tracker.enable()
                else:
                    auto_tracker.disable()
                send_ack("mode_change")

            else:
                send_error(f"Unknown command type: {cmd_type}")

        except Exception as e:
            send_error(str(e))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
