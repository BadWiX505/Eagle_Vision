import type { ViolenceDetection } from "@/types";

export const MOCK_VIOLENCE_DETECTIONS: ViolenceDetection[] = [
  {
    id: "mock-vd-001",
    timestamp: "2026-04-26T10:15:32Z",
    cameraId: "cam-001",
    zone: "zone-a",
    confidence: 0.941,
    bbox: { x: 0.31, y: 0.22, w: 0.28, h: 0.35 },
    imageUrl: "/api/detections/violence/mock-vd-001/image",
  },
  {
    id: "mock-vd-002",
    timestamp: "2026-04-26T10:08:11Z",
    cameraId: "cam-001",
    zone: "zone-a",
    confidence: 0.873,
    bbox: { x: 0.45, y: 0.18, w: 0.22, h: 0.31 },
    imageUrl: "/api/detections/violence/mock-vd-002/image",
  },
  {
    id: "mock-vd-003",
    timestamp: "2026-04-26T09:52:44Z",
    cameraId: "cam-001",
    zone: "zone-b",
    confidence: 0.912,
    bbox: { x: 0.12, y: 0.30, w: 0.33, h: 0.40 },
    imageUrl: "/api/detections/violence/mock-vd-003/image",
  },
  {
    id: "mock-vd-004",
    timestamp: "2026-04-26T09:34:07Z",
    cameraId: "cam-001",
    zone: "zone-a",
    confidence: 0.788,
    bbox: { x: 0.60, y: 0.25, w: 0.20, h: 0.28 },
    imageUrl: "/api/detections/violence/mock-vd-004/image",
  },
  {
    id: "mock-vd-005",
    timestamp: "2026-04-26T08:57:19Z",
    cameraId: "cam-001",
    zone: "zone-c",
    confidence: 0.856,
    bbox: { x: 0.25, y: 0.35, w: 0.30, h: 0.38 },
    imageUrl: "/api/detections/violence/mock-vd-005/image",
  },
];
