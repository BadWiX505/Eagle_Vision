import type { Alert } from "@/types";

export const MOCK_ALERTS: Alert[] = [
  {
    id: "alt-001",
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    cameraId: "cam-001",
    zone: "zone-a",
    type: "weapon",
    severity: "high",
    message: "Possible weapon detected near north gate",
    read: false,
  },
  {
    id: "alt-002",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    cameraId: "cam-005",
    zone: "zone-c",
    type: "violence",
    severity: "high",
    message: "Fight detected at south entrance",
    read: false,
  },
  {
    id: "alt-003",
    timestamp: new Date(Date.now() - 9 * 60000).toISOString(),
    cameraId: "cam-003",
    zone: "zone-b",
    type: "crowd",
    severity: "medium",
    message: "Crowd density exceeds threshold",
    read: true,
  },
  {
    id: "alt-004",
    timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
    cameraId: "cam-007",
    zone: "zone-d",
    type: "anomaly",
    severity: "low",
    message: "Unattended bag detected in VIP lounge",
    read: true,
  },
  {
    id: "alt-005",
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    cameraId: "cam-002",
    zone: "zone-a",
    type: "anomaly",
    severity: "medium",
    message: "Unauthorized area access attempt",
    read: true,
  },
  {
    id: "alt-006",
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    cameraId: "cam-006",
    zone: "zone-c",
    type: "crowd",
    severity: "low",
    message: "Bottleneck forming at south concourse",
    read: true,
  },
];

let alertCounter = 7;

const ALERT_TEMPLATES = [
  { type: "weapon" as const, severity: "high" as const, message: "Suspicious object detected" },
  { type: "violence" as const, severity: "high" as const, message: "Aggressive behavior detected" },
  { type: "crowd" as const, severity: "medium" as const, message: "Crowd surge detected" },
  { type: "anomaly" as const, severity: "low" as const, message: "Unusual movement pattern" },
  { type: "anomaly" as const, severity: "medium" as const, message: "Perimeter breach attempt" },
];

const CAMERA_IDS = ["cam-001", "cam-002", "cam-003", "cam-005", "cam-006", "cam-007"];
const ZONE_IDS = ["zone-a", "zone-b", "zone-c", "zone-d"];

export function generateMockAlert(): Alert {
  const template = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)];
  const camId = CAMERA_IDS[Math.floor(Math.random() * CAMERA_IDS.length)];
  const zone = ZONE_IDS[Math.floor(Math.random() * ZONE_IDS.length)];
  return {
    id: `alt-${String(alertCounter++).padStart(3, "0")}`,
    timestamp: new Date().toISOString(),
    cameraId: camId,
    zone,
    type: template.type,
    severity: template.severity,
    message: template.message,
    read: false,
  };
}
