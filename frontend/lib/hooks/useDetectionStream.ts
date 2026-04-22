"use client";
import { useEffect, useRef } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { Alert, BoundingBox } from "@/types";

const WS_URL = "ws://localhost:5000/api/ws";
const MAX_RECONNECT_DELAY_MS = 30_000;

interface DetectionMessage {
  camera_id: string;
  zone: string;
  timestamp: string;
  bboxes: BoundingBox[];
  alert: Alert | null;
  weapon_detected?: boolean;
  tracker_locked?: boolean;
}

/**
 * Opens a WebSocket to the backend detection endpoint and:
 *  - Pushes bboxes to the store (filtered to the currently selected camera)
 *  - Adds alerts globally whenever the backend emits one
 *
 * Reconnects automatically with exponential back-off on disconnect.
 * Call once at the page root — the connection is stable across camera switches.
 */
export function useDetectionStream() {
  const setBboxes = useDashboardStore((s) => s.setBboxes);
  const addAlert = useDashboardStore((s) => s.addAlert);
  const setWeaponDetected = useDashboardStore((s) => s.setWeaponDetected);
  const setTrackerLocked  = useDashboardStore((s) => s.setTrackerLocked);
  const selectedCamera = useDashboardStore((s) => s.selectedCamera);

  // Refs so the WebSocket handler always reads the latest values
  // without needing to be re-created on every state change.
  const cameraIdRef = useRef<string | null | undefined>(selectedCamera?.id);
  const setBboxesRef         = useRef(setBboxes);
  const addAlertRef          = useRef(addAlert);
  const setWeaponDetectedRef = useRef(setWeaponDetected);
  const setTrackerLockedRef  = useRef(setTrackerLocked);

  useEffect(() => { cameraIdRef.current         = selectedCamera?.id; }, [selectedCamera]);
  useEffect(() => { setBboxesRef.current         = setBboxes;         }, [setBboxes]);
  useEffect(() => { addAlertRef.current          = addAlert;           }, [addAlert]);
  useEffect(() => { setWeaponDetectedRef.current = setWeaponDetected;  }, [setWeaponDetected]);
  useEffect(() => { setTrackerLockedRef.current  = setTrackerLocked;   }, [setTrackerLocked]);

  // Single stable WebSocket connection — created once on mount.
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 1_000;
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        reconnectDelay = 1_000; // reset back-off on successful connect
      };

      ws.onmessage = (event: MessageEvent) => {
        let msg: DetectionMessage;
        try {
          msg = JSON.parse(event.data as string) as DetectionMessage;
        } catch {
          return;
        }

        // Bboxes: only apply when the message belongs to the selected camera
        const currentCameraId = cameraIdRef.current;
        if (!currentCameraId || msg.camera_id === currentCameraId) {
          setBboxesRef.current(msg.bboxes ?? []);
        }

        // Tracking status (real-time, no cooldown)
        setWeaponDetectedRef.current(msg.weapon_detected ?? false);
        setTrackerLockedRef.current(msg.tracker_locked ?? false);

        // Alerts: always surface regardless of which camera is selected
        if (msg.alert) {
          addAlertRef.current(msg.alert);
        }
      };

      ws.onclose = () => {
        if (destroyed) return;
        reconnectTimer = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
          connect();
        }, reconnectDelay);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null; // prevent reconnect loop on intentional teardown
        ws.close();
      }
      setBboxesRef.current([]); // clear stale boxes on unmount
    };
  }, []); // intentionally empty — single stable connection
}
