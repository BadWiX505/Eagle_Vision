import { create } from "zustand";
import type { DashboardState, Camera, Alert, SystemMode, BoundingBox, CameraPosition, RailDirection } from "@/types";
import { MOCK_CAMERAS } from "@/lib/mock/cameras";
import { MOCK_ALERTS } from "@/lib/mock/alerts";

export const useDashboardStore = create<DashboardState>((set) => ({
  cameras: MOCK_CAMERAS,
  selectedCamera: MOCK_CAMERAS[0],
  selectedZone: null,
  alerts: MOCK_ALERTS,
  mode: "AUTO",
  bboxes: [],
  ptzSpeed: 50,
  videoFocused: false,
  cameraPosition: { pan: 90, tilt: 110 },
  railRunning: false,
  railDirection: "forward" as RailDirection,
  weaponDetected: false,
  trackerLocked: false,

  setSelectedCamera: (camera: Camera | null) =>
    set({ selectedCamera: camera }),

  setSelectedZone: (zoneId: string | null) =>
    set({ selectedZone: zoneId }),

  setMode: (mode: SystemMode) =>
    set({ mode }),

  addAlert: (alert: Alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 50),
    })),

  markAlertRead: (id: string) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
    })),

  setBboxes: (boxes: BoundingBox[]) =>
    set({ bboxes: boxes }),

  setPtzSpeed: (speed: number) =>
    set({ ptzSpeed: speed }),

  setVideoFocused: (focused: boolean) =>
    set({ videoFocused: focused }),

  setCameraPosition: (pos: CameraPosition) =>
    set({ cameraPosition: pos }),

  setRailRunning: (running: boolean) =>
    set({ railRunning: running }),

  setRailDirection: (dir: RailDirection) =>
    set({ railDirection: dir }),

  setWeaponDetected: (detected: boolean) =>
    set({ weaponDetected: detected }),

  setTrackerLocked: (locked: boolean) =>
    set({ trackerLocked: locked }),
}));
