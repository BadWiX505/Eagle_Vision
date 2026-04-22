from __future__ import annotations

import cv2
import numpy as np

from models.base_model import BBoxResult, DetectionOutput
from models.baseball_model import BaseballDetector
from models.weapon_model import WeaponDetector
from models.violence_model import ViolenceClassifier

# All models run on this resolution so bbox coords are always consistent.
# BoundingBoxOverlay in the frontend also uses 640×360 as its reference.
FRAME_W = 640
FRAME_H = 360

_SEVERITY_RANK: dict[str, int] = {"high": 3, "medium": 2, "low": 1}


class DetectionPipeline:
    """
    Orchestrates all ML detectors for a single frame.

    Usage:
        pipeline = DetectionPipeline()          # load models once
        output = pipeline.run(frame)            # call per frame
    """

    def __init__(self) -> None:
        print("DetectionPipeline: loading BaseballDetector …")
        self.baseball = BaseballDetector()
        print("DetectionPipeline: loading WeaponDetector …")
        self.weapon = WeaponDetector()
        print("DetectionPipeline: loading ViolenceClassifier …")
        self.violence = ViolenceClassifier()
        print("DetectionPipeline: all models ready.")

    def run(self, frame: np.ndarray) -> DetectionOutput:
        """
        Resize *frame* to the reference resolution, run all detectors,
        merge bboxes and pick the highest-severity alert.
        """
        small = cv2.resize(frame, (FRAME_W, FRAME_H))

        baseball_out = self.baseball.detect(small)
        weapon_out = self.weapon.detect(small)
        violence_out = self.violence.detect(small)

        # Merge bounding boxes from all detectors (violence now produces bboxes too)
        all_bboxes: list[BBoxResult] = baseball_out.bboxes + weapon_out.bboxes + violence_out.bboxes

        # Pick the highest-severity alert across all detectors
        best_alert: tuple[str, str, str] | None = None
        best_rank = 0
        for output in (baseball_out, weapon_out, violence_out):
            if output.alert_type is not None:
                rank = _SEVERITY_RANK.get(output.alert_severity or "", 0)
                if rank > best_rank:
                    best_rank = rank
                    best_alert = (
                        output.alert_type,
                        output.alert_severity,   # type: ignore[arg-type]
                        output.alert_message,    # type: ignore[arg-type]
                    )

        result = DetectionOutput(bboxes=all_bboxes)
        if best_alert:
            result.alert_type, result.alert_severity, result.alert_message = best_alert

        return result
