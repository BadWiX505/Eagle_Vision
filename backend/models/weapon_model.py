from __future__ import annotations

import numpy as np
from inference import get_model
from .base_model import BaseDetector, BBoxResult, DetectionOutput

_ROBOFLOW_API_KEY = "mtdBhZCqQk0m3JqPgNMt"
_MODEL_ID = "weapon-detection-7kro8/2"
_CONFIDENCE_THRESHOLD = 0.70  # <--- Added threshold constant

class WeaponDetector(BaseDetector):
    """
    Detects weapons using a local Roboflow object detection model.
    Any detection >= 70% confidence triggers a high-severity alert.
    """

    def __init__(self):
        # Automatically downloads weights (on first run) and loads into RAM/VRAM
        self.model = get_model(model_id=_MODEL_ID, api_key=_ROBOFLOW_API_KEY)

    def detect(self, frame: np.ndarray) -> DetectionOutput:
        bboxes: list[BBoxResult] = []

        try:
            # Local models return a list of responses, so [0].dict() gets the current frame
            res = self.model.infer(frame)[0].dict()
            
            for pred in res.get("predictions", []):
                conf = float(pred["confidence"])
                
                # <--- Added the check here
                if conf >= _CONFIDENCE_THRESHOLD:
                    cx = float(pred["x"])
                    cy = float(pred["y"])
                    w = float(pred["width"])
                    h = float(pred["height"])
                    label = (pred.get("class_name") or pred.get("class", "weapon")).lower()
                    
                    bboxes.append(
                        BBoxResult(
                            x=cx - w / 2,
                            y=cy - h / 2,
                            w=w,
                            h=h,
                            label=label,
                            confidence=conf,
                        )
                    )
                
        except Exception as e:
            # Replaced the silent 'pass' so you can actually see if it crashes
            print(f"Weapon Local Inference Error: {e}")

        output = DetectionOutput(bboxes=bboxes)
        
        if bboxes:
            names = ", ".join(sorted({b.label.capitalize() for b in bboxes}))
            output.alert_type = "weapon"
            output.alert_severity = "high"
            output.alert_message = f"Weapon detected: {names}"

        return output