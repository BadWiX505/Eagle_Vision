"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { ControlCommand, ControlAck } from "@/types";

const CONTROL_WS_URL = "ws://localhost:5000/api/ws/control";
const MAX_RECONNECT_DELAY_MS = 30_000;

export function useControlStream() {
  const setCameraPosition = useDashboardStore((s) => s.setCameraPosition);
  const setRailRunning    = useDashboardStore((s) => s.setRailRunning);

  const wsRef              = useRef<WebSocket | null>(null);
  const destroyedRef       = useRef(false);
  const reconnectTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef  = useRef(1_000);

  const setCameraPositionRef = useRef(setCameraPosition);
  const setRailRunningRef    = useRef(setRailRunning);
  useEffect(() => { setCameraPositionRef.current = setCameraPosition; }, [setCameraPosition]);
  useEffect(() => { setRailRunningRef.current    = setRailRunning; },    [setRailRunning]);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    destroyedRef.current = false;

    function connect() {
      if (destroyedRef.current) return;
      const ws = new WebSocket(CONTROL_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectDelayRef.current = 1_000;
        setConnected(true);
      };

      ws.onmessage = (event: MessageEvent) => {
        let msg: ControlAck;
        try { msg = JSON.parse(event.data as string) as ControlAck; }
        catch { return; }

        if (msg.type === "ack") {
          setCameraPositionRef.current({ pan: msg.pan, tilt: msg.tilt });
          setRailRunningRef.current(msg.rail_running);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (destroyedRef.current) return;
        reconnectTimerRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            MAX_RECONNECT_DELAY_MS,
          );
          connect();
        }, reconnectDelayRef.current);
      };

      ws.onerror = () => { ws.close(); };
    }

    connect();

    return () => {
      destroyedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const sendCommand = useCallback((cmd: ControlCommand) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(cmd));
    }
  }, []);

  return { sendCommand, connected };
}
