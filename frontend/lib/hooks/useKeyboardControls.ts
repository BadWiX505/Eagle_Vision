"use client";
import { useEffect } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { RailDirection } from "@/types";

/**
 * Keyboard shortcuts active only in MANUAL mode and when no text input is focused.
 *
 * Camera PTZ:
 *   ArrowUp    → tilt up
 *   ArrowDown  → tilt down
 *   ArrowLeft  → pan left
 *   ArrowRight → pan right
 *   D          → reset to default position
 *
 * Rail:
 *   [    → set direction backward
 *   ]    → set direction forward
 *   Space → toggle rail start / stop
 */

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName ?? "";
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function speedToDegree(speed: number): number {
  return Math.max(1, Math.round((speed / 100) * 20));
}

export function useKeyboardControls(
  sendCommand: (cmd: import("@/types").ControlCommand) => void,
) {
  const mode       = useDashboardStore((s) => s.mode);
  const ptzSpeed   = useDashboardStore((s) => s.ptzSpeed);
  const railRunning = useDashboardStore((s) => s.railRunning);
  const railDir    = useDashboardStore((s) => s.railDirection);
  const setRailDir = useDashboardStore((s) => s.setRailDirection);

  useEffect(() => {
    if (mode !== "MANUAL") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      const degree = speedToDegree(ptzSpeed);

      switch (e.key) {
        // ── Camera PTZ ──────────────────────────────────────────────────────
        case "ArrowUp":
          e.preventDefault();
          sendCommand({ type: "camera_move", axis: "y", degree: -degree });
          break;
        case "ArrowDown":
          e.preventDefault();
          sendCommand({ type: "camera_move", axis: "y", degree: degree });
          break;
        case "ArrowLeft":
          e.preventDefault();
          sendCommand({ type: "camera_move", axis: "x", degree: -degree });
          break;
        case "ArrowRight":
          e.preventDefault();
          sendCommand({ type: "camera_move", axis: "x", degree: degree });
          break;
        case "d":
        case "D":
          e.preventDefault();
          sendCommand({ type: "camera_reset" });
          break;

        // ── Rail ────────────────────────────────────────────────────────────
        case "[":
          e.preventDefault();
          setRailDir("backward");
          sendCommand({ type: "rail_direction", direction: "backward" });
          break;
        case "]":
          e.preventDefault();
          setRailDir("forward");
          sendCommand({ type: "rail_direction", direction: "forward" });
          break;
        case " ":
          e.preventDefault();
          sendCommand({ type: railRunning ? "rail_stop" : "rail_start" });
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, ptzSpeed, railRunning, railDir, setRailDir, sendCommand]);
}
