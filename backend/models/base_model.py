from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

import numpy as np


@dataclass
class BBoxResult:
    """A single detected bounding box in the 640×360 reference frame."""

    x: float          # top-left x (pixels)
    y: float          # top-left y (pixels)
    w: float          # width  (pixels)
    h: float          # height (pixels)
    label: str        # class name, e.g. "weapon", "ball"
    confidence: float # 0.0 – 1.0


@dataclass
class DetectionOutput:
    """Aggregated result produced by one detector for a single frame."""

    bboxes: list[BBoxResult] = field(default_factory=list)
    alert_type: Optional[str] = None      # "weapon" | "violence" | "anomaly" | "crowd"
    alert_severity: Optional[str] = None  # "high" | "medium" | "low"
    alert_message: Optional[str] = None


class BaseDetector(ABC):
    """Common interface every detector must implement."""

    @abstractmethod
    def detect(self, frame: np.ndarray) -> DetectionOutput:
        ...
