"""
Violence Detection Storage
--------------------------
Stores cropped bbox snapshots and metadata for violence detections.

CONFIGURABLE:
  VIOLENCE_STORE_INTERVAL — minimum seconds between stored detections
  per camera. Increase this to reduce saved snapshots; decrease it to
  capture more frequently.
"""
import json
import os
import threading
import time
import uuid

import cv2
import numpy as np

# ---------------------------------------------------------------------------
# Configuration — single place to change the dedup interval (seconds).
# ---------------------------------------------------------------------------
VIOLENCE_STORE_INTERVAL: int = 10  # seconds between stored detections per camera


# ---------------------------------------------------------------------------
# Store
# ---------------------------------------------------------------------------
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_SNAPSHOTS_DIR = os.path.join(_BASE_DIR, "snapshots")
_DETECTIONS_FILE = os.path.join(_BASE_DIR, "detections.json")


class ViolenceDetectionStore:
    """Thread-safe store for violence detection snapshots and metadata."""

    def __init__(self) -> None:
        os.makedirs(_SNAPSHOTS_DIR, exist_ok=True)

        self._lock = threading.Lock()

        # Load existing detections from disk (or start fresh).
        if os.path.exists(_DETECTIONS_FILE):
            try:
                with open(_DETECTIONS_FILE, "r") as f:
                    self._detections: list[dict] = json.load(f)
            except (json.JSONDecodeError, OSError):
                self._detections = []
        else:
            self._detections = []

        # Per-camera last-store timestamps.
        self._last_store: dict[str, float] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def can_store(self, camera_id: str) -> bool:
        """Return True if the dedup interval has elapsed for this camera."""
        with self._lock:
            return time.time() - self._last_store.get(camera_id, 0) >= VIOLENCE_STORE_INTERVAL

    def store(
        self,
        camera_id: str,
        zone: str,
        confidence: float,
        bbox: dict,
        frame: np.ndarray,
    ) -> dict:
        """
        Crop the frame to the bbox, save as JPEG, and persist metadata.

        Parameters
        ----------
        camera_id : str
        zone      : str
        confidence: float  0–1
        bbox      : dict   {x, y, w, h}  — normalised 0–1 coordinates
        frame     : np.ndarray  full BGR frame (H×W×3)

        Returns the stored detection record.
        """
        h_px, w_px = frame.shape[:2]

        # bbox coordinates are already in pixels (from YOLO xyxy output).
        x = int(bbox["x"])
        y = int(bbox["y"])
        w = int(bbox["w"])
        h = int(bbox["h"])

        # Clamp to frame bounds.
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(w_px, x + w)
        y2 = min(h_px, y + h)

        crop = frame[y1:y2, x1:x2]

        detection_id = str(uuid.uuid4())
        image_filename = f"{detection_id}.jpg"
        image_path = os.path.join(_SNAPSHOTS_DIR, image_filename)

        # Fall back to a blank image if crop is degenerate.
        if crop.size == 0:
            crop = np.zeros((80, 80, 3), dtype=np.uint8)

        cv2.imwrite(image_path, crop, [cv2.IMWRITE_JPEG_QUALITY, 85])

        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        record = {
            "id": detection_id,
            "timestamp": timestamp,
            "cameraId": camera_id,
            "zone": zone,
            "confidence": round(float(confidence), 3),
            "bbox": {"x": bbox["x"], "y": bbox["y"], "w": bbox["w"], "h": bbox["h"]},
            "imageUrl": f"/api/detections/violence/{detection_id}/image",
        }

        with self._lock:
            self._detections.append(record)
            self._last_store[camera_id] = time.time()
            self._persist()

        return record

    def get_all(self) -> list[dict]:
        """Return all stored detections sorted newest-first."""
        with self._lock:
            return sorted(self._detections, key=lambda d: d["timestamp"], reverse=True)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _persist(self) -> None:
        """Write detections list to disk. Must be called with _lock held."""
        try:
            with open(_DETECTIONS_FILE, "w") as f:
                json.dump(self._detections, f, indent=2)
        except OSError as exc:
            print(f"[ViolenceDetectionStore] Failed to persist: {exc}")
