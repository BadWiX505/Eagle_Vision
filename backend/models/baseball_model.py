from __future__ import annotations

import numpy as np
from ultralytics import YOLO

from .base_model import BaseDetector, BBoxResult, DetectionOutput


class BaseballDetector(BaseDetector):
    """
    Detects sports balls (COCO class 32) using a local YOLOv8 model.
    Returns bboxes only; does not raise alerts on its own.
    """

    def __init__(self, model_path: str = "yolov8n.pt", conf: float = 0.4):
        self.model = YOLO(model_path)
        self.conf = conf

    def detect(self, frame: np.ndarray) -> DetectionOutput:
        results = self.model(frame, classes=[32], conf=self.conf, verbose=False)
        bboxes: list[BBoxResult] = []

        if results and results[0].boxes is not None:
            for box in results[0].boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bboxes.append(
                    BBoxResult(
                        x=x1,
                        y=y1,
                        w=x2 - x1,
                        h=y2 - y1,
                        label="ball",
                        confidence=float(box.conf[0]),
                    )
                )

        return DetectionOutput(bboxes=bboxes)
