from __future__ import annotations

import os
import numpy as np
from ultralytics import YOLO
from .base_model import BaseDetector, BBoxResult, DetectionOutput

# Class IDs from the Fight-Violence-detection-yolov8 model:
#   0 = NoViolence/NoFight
#   1 = Violence/Fight  (the one we alert on)
_VIOLENCE_CLASS_ID = 1
_VIOLENCE_CLASS_NAMES = {0: "NoViolence", 1: "Violence"}
_CONFIDENCE_THRESHOLD = 0.50

_WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "..", "yolo_small_weights.pt")


class ViolenceClassifier(BaseDetector):
    """
    Detects violence/fights using the yolo_small_weights YOLOv8 model from
    https://github.com/Musawer1214/Fight-Violence-detection-yolov8

    The model produces bounding boxes around violent events. Any frame with at
    least one Violence detection above the confidence threshold triggers a
    high-severity alert.
    """

    def __init__(self):
        self.model = YOLO(_WEIGHTS_PATH)

    def detect(self, frame: np.ndarray) -> DetectionOutput:
        try:
            results = self.model(frame, verbose=False)[0]
            bboxes: list[BBoxResult] = []
            violence_detected = False
            max_conf = 0.0

            for box in results.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])

                if cls_id != _VIOLENCE_CLASS_ID or conf < _CONFIDENCE_THRESHOLD:
                    continue

                # xyxy → x, y, w, h
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bboxes.append(BBoxResult(
                    x=x1,
                    y=y1,
                    w=x2 - x1,
                    h=y2 - y1,
                    label="Violence",
                    confidence=conf,
                ))
                violence_detected = True
                if conf > max_conf:
                    max_conf = conf

            if violence_detected:
                return DetectionOutput(
                    bboxes=bboxes,
                    alert_type="violence",
                    alert_severity="high",
                    alert_message=f"Violence detected (conf: {max_conf:.2f})",
                )

        except Exception as e:
            print(f"ViolenceClassifier inference error: {e}")

        return DetectionOutput()