// ─── Camera ──────────────────────────────────────────────────────────────────

export type CameraDirection = "north" | "south" | "east" | "west";
export type CameraStatus = "online" | "offline";

export interface Camera {
  id: string;
  name: string;
  zone: string;
  direction: CameraDirection;
  streamUrl: string;
  status: CameraStatus;
}

// ─── Zones ───────────────────────────────────────────────────────────────────

export interface Zone {
  id: string;
  label: string;
  description: string;
  color: string;
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export type AlertType = "weapon" | "violence" | "anomaly" | "crowd";
export type AlertSeverity = "low" | "medium" | "high";

export interface Alert {
  id: string;
  timestamp: string;
  cameraId: string;
  zone: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  read: boolean;
}

// ─── Bounding Boxes ──────────────────────────────────────────────────────────

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  confidence: number;
}

// ─── System Mode ─────────────────────────────────────────────────────────────

export type SystemMode = "AUTO" | "MANUAL";

// ─── Hardware Control ─────────────────────────────────────────────────────────

export type RailDirection = "forward" | "backward";

export type ControlCommand =
  | { type: "camera_move"; axis: "x" | "y"; degree: number }
  | { type: "camera_reset" }
  | { type: "rail_start" }
  | { type: "rail_stop" }
  | { type: "rail_direction"; direction: RailDirection }
  | { type: "mode_change"; mode: SystemMode };

export interface CameraPosition {
  pan: number;
  tilt: number;
}

export interface ControlAck {
  type: "ack";
  command: string;
  pan: number;
  tilt: number;
  rail_running: boolean;
}

// ─── Dashboard Store State ───────────────────────────────────────────────────

export interface DashboardState {
  cameras: Camera[];
  selectedCamera: Camera | null;
  selectedZone: string | null;
  alerts: Alert[];
  mode: SystemMode;
  bboxes: BoundingBox[];
  ptzSpeed: number;
  videoFocused: boolean;
  cameraPosition: CameraPosition;
  railRunning: boolean;
  railDirection: RailDirection;
  /** True when the backend reports a weapon in the current frame (no cooldown). */
  weaponDetected: boolean;
  /** True when the auto-tracker has locked onto a target and is centred. */
  trackerLocked: boolean;

  // Actions
  setSelectedCamera: (camera: Camera | null) => void;
  setSelectedZone: (zoneId: string | null) => void;
  setMode: (mode: SystemMode) => void;
  addAlert: (alert: Alert) => void;
  markAlertRead: (id: string) => void;
  setBboxes: (boxes: BoundingBox[]) => void;
  setPtzSpeed: (speed: number) => void;
  setVideoFocused: (focused: boolean) => void;
  setCameraPosition: (pos: CameraPosition) => void;
  setRailRunning: (running: boolean) => void;
  setRailDirection: (dir: RailDirection) => void;
  setWeaponDetected: (detected: boolean) => void;
  setTrackerLocked: (locked: boolean) => void;
}
