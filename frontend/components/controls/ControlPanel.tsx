"use client";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Play,
  Square,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useControlStream } from "@/lib/hooks/useControlStream";
import { useKeyboardControls } from "@/lib/hooks/useKeyboardControls";
import type { SystemMode, RailDirection } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODES: SystemMode[] = ["AUTO", "MANUAL"];

const MODE_COLORS: Record<SystemMode, { color: string; bg: string }> = {
  AUTO:   { color: "#00d4ff", bg: "rgba(0,212,255,0.12)" },
  MANUAL: { color: "#ff8c00", bg: "rgba(255,140,0,0.12)" },
};

/** Maps speed (1-100) → degrees for camera movement */
function speedToDegree(speed: number): number {
  return Math.max(1, Math.round((speed / 100) * 20));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ControlPanel() {
  const mode            = useDashboardStore((s) => s.mode);
  const setMode         = useDashboardStore((s) => s.setMode);
  const ptzSpeed        = useDashboardStore((s) => s.ptzSpeed);
  const setPtzSpeed     = useDashboardStore((s) => s.setPtzSpeed);
  const cameraPos       = useDashboardStore((s) => s.cameraPosition);
  const railRunning     = useDashboardStore((s) => s.railRunning);
  const railDir         = useDashboardStore((s) => s.railDirection);
  const setRailDir      = useDashboardStore((s) => s.setRailDirection);
  const weaponDetected  = useDashboardStore((s) => s.weaponDetected);
  const trackerLocked   = useDashboardStore((s) => s.trackerLocked);

  const { sendCommand, connected } = useControlStream();

  // Keyboard shortcuts (active only in MANUAL mode)
  useKeyboardControls(sendCommand);

  const modeStyle = MODE_COLORS[mode];
  const degree = speedToDegree(ptzSpeed);

  // ── PTZ handlers ──
  const moveCamera = (axis: "x" | "y", sign: 1 | -1) =>
    sendCommand({ type: "camera_move", axis, degree: sign * degree });

  const resetCamera = () => sendCommand({ type: "camera_reset" });

  // ── Rail handlers ──
  const toggleRail = () =>
    sendCommand({ type: railRunning ? "rail_stop" : "rail_start" });

  const changeDirection = (dir: RailDirection) => {
    setRailDir(dir);
    sendCommand({ type: "rail_direction", direction: dir });
  };

  // ── Mode handler — also syncs the backend tracker ──
  const handleModeChange = (m: typeof mode) => {
    setMode(m);
    sendCommand({ type: "mode_change", mode: m });
  };

  return (
    <div
      className="glass flex items-center gap-6 px-6 py-3 shrink-0"
      style={{ borderTop: "1px solid rgba(0,212,255,0.1)" }}
    >
      <span className="text-[10px] font-mono text-[#4a6680] tracking-[0.2em] uppercase whitespace-nowrap">
        Control Panel
      </span>

      {/* Mode selector */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-mono text-[#4a6680] mr-2 tracking-widest">MODE</span>
        {MODES.map((m) => {
          const active = mode === m;
          const style  = MODE_COLORS[m];
          return (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className="px-3 py-1 rounded text-[10px] font-mono font-bold tracking-widest transition-all duration-200"
              style={{
                background: active ? style.bg  : "rgba(13,25,40,0.8)",
                border:     `1px solid ${active ? style.color : "rgba(0,212,255,0.1)"}`,
                color:      active ? style.color : "#4a6680",
                boxShadow:  active ? `0 0 10px ${style.color}30` : "none",
              }}
            >
              {m}
            </button>
          );
        })}

        {/* Auto-tracking live status badge */}
        {mode === "AUTO" && (
          <div
            className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest"
            style={{
              background: trackerLocked
                ? "rgba(255,59,59,0.15)"
                : weaponDetected
                  ? "rgba(255,140,0,0.15)"
                  : "rgba(0,212,255,0.08)",
              border: `1px solid ${
                trackerLocked
                  ? "rgba(255,59,59,0.6)"
                  : weaponDetected
                    ? "rgba(255,140,0,0.6)"
                    : "rgba(0,212,255,0.2)"
              }`,
              color: trackerLocked
                ? "#ff3b3b"
                : weaponDetected
                  ? "#ff8c00"
                  : "#4a6680",
              boxShadow: trackerLocked ? "0 0 8px rgba(255,59,59,0.3)" : "none",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: trackerLocked ? "#ff3b3b" : weaponDetected ? "#ff8c00" : "#4a6680",
                animation:  trackerLocked || weaponDetected ? "pulse 1s infinite" : "none",
              }}
            />
            {trackerLocked ? "LOCKED" : weaponDetected ? "TRACKING" : "SCANNING"}
          </div>
        )}
      </div>

      <div className="w-px h-8 bg-[rgba(0,212,255,0.1)]" />

      {/* ── MANUAL controls ── */}
      {mode === "MANUAL" && (
        <>
          {/* WS connection indicator */}
          <div className="flex items-center gap-1.5">
            {connected
              ? <Wifi size={11} className="text-[#00ff88]" />
              : <WifiOff size={11} className="text-[#ff4444]" />}
            <span
              className="text-[9px] font-mono tracking-widest"
              style={{ color: connected ? "#00ff88" : "#ff4444" }}
            >
              {connected ? "HW LINK" : "NO LINK"}
            </span>
          </div>

          <div className="w-px h-8 bg-[rgba(0,212,255,0.1)]" />

          {/* Camera PTZ grid */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#4a6680] tracking-widest">CAM</span>

            <div className="grid grid-cols-3 gap-0.5 w-16">
              <div />
              <PTZButton
                icon={<ChevronUp size={12} />}
                label="Up"
                kbdHint="↑"
                onClick={() => moveCamera("y", -1)}
              />
              <div />
              <PTZButton
                icon={<ChevronLeft size={12} />}
                label="Left"
                kbdHint="←"
                onClick={() => moveCamera("x", -1)}
              />
              {/* Centre / reset — key: D */}
              <button
                aria-label="Reset"
                title="Reset camera to default  [D]"
                onClick={resetCamera}
                className="w-5 h-5 rounded flex items-center justify-center transition-all duration-150 active:scale-90 relative group"
                style={{
                  background:   "rgba(255,140,0,0.08)",
                  border:       "1px solid rgba(255,140,0,0.25)",
                  color:        "#ff8c00",
                }}
              >
                <RotateCcw size={9} />
                <KbdBadge label="D" />
              </button>
              <PTZButton
                icon={<ChevronRight size={12} />}
                label="Right"
                kbdHint="→"
                onClick={() => moveCamera("x", 1)}
              />
              <div />
              <PTZButton
                icon={<ChevronDown size={12} />}
                label="Down"
                kbdHint="↓"
                onClick={() => moveCamera("y", 1)}
              />
              <div />
            </div>

            {/* Position readout */}
            <div className="flex flex-col gap-0.5 text-[9px] font-mono tabular-nums text-[#4a6680]">
              <span>PAN  <span className="text-[#ff8c00]">{cameraPos.pan}°</span></span>
              <span>TILT <span className="text-[#ff8c00]">{cameraPos.tilt}°</span></span>
            </div>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-2 w-36">
            <span className="text-[10px] font-mono text-[#4a6680] whitespace-nowrap tracking-widest">SPD</span>
            <input
              type="range" min={1} max={100} value={ptzSpeed}
              onChange={(e) => setPtzSpeed(Number(e.target.value))}
              className="flex-1 h-1 cursor-pointer"
              style={{ accentColor: "#ff8c00" }}
            />
            <span className="text-[10px] font-mono tabular-nums w-7 text-right text-[#ff8c00]">
              {degree}°
            </span>
          </div>

          <div className="w-px h-8 bg-[rgba(0,212,255,0.1)]" />

          {/* Rail controls */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#4a6680] tracking-widest">RAIL</span>

            {/* Direction toggle */}
            <div className="flex items-center gap-0.5">
              {(["backward", "forward"] as RailDirection[]).map((dir) => {
                const active = railDir === dir;
                const kbdKey = dir === "backward" ? "[" : "]";
                return (
                  <button
                    key={dir}
                    onClick={() => changeDirection(dir)}
                    title={dir === "forward" ? "Forward / Right  [ ] ]" : "Backward / Left  [ [ ]"}
                    className="w-6 h-6 rounded flex items-center justify-center transition-all duration-150 active:scale-90 relative group"
                    style={{
                      background: active ? "rgba(255,140,0,0.18)" : "rgba(13,25,40,0.8)",
                      border:     `1px solid ${active ? "#ff8c00" : "rgba(0,212,255,0.1)"}`,
                      color:      active ? "#ff8c00" : "#4a6680",
                    }}
                  >
                    {dir === "forward"
                      ? <ArrowRight size={11} />
                      : <ArrowLeft  size={11} />}
                    <KbdBadge label={kbdKey} />
                  </button>
                );
              })}
            </div>

            {/* Start / Stop — key: Space */}
            <button
              onClick={toggleRail}
              title={`${railRunning ? "Stop" : "Start"} rail  [Space]`}
              className="relative group flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono font-bold tracking-widest transition-all duration-200 active:scale-95"
              style={{
                background: railRunning ? "rgba(255,68,68,0.15)" : "rgba(0,255,136,0.10)",
                border:     `1px solid ${railRunning ? "#ff4444" : "#00ff88"}`,
                color:      railRunning ? "#ff4444" : "#00ff88",
                boxShadow:  railRunning ? "0 0 8px #ff444430" : "0 0 8px #00ff8830",
              }}
            >
              {railRunning
                ? <><Square  size={9} /> STOP</>
                : <><Play    size={9} /> START</>}
              <KbdBadge label="SPC" />
            </button>

            {/* Status dot */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: railRunning ? "#00ff88" : "#4a6680",
                  boxShadow:  railRunning ? "0 0 6px #00ff88" : "none",
                }}
              />
              <span
                className="text-[9px] font-mono tracking-widest"
                style={{ color: railRunning ? "#00ff88" : "#4a6680" }}
              >
                {railRunning ? "RUNNING" : "STOPPED"}
              </span>
            </div>
          </div>
        </>
      )}

      {/* System status (always visible) */}
      <div className="ml-auto flex items-center gap-3 text-[10px] font-mono text-[#4a6680]">
        <span>CPU <span className="text-[#00d4ff]">42%</span></span>
        <span>GPU <span className="text-[#8b5cf6]">78%</span></span>
        <span>SYS <span className="text-[#00ff88]">NOMINAL</span></span>
      </div>
    </div>
  );
}

// ─── PTZ Button ───────────────────────────────────────────────────────────────

function PTZButton({
  icon,
  label,
  kbdHint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  kbdHint?: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={kbdHint ? `${label}  [${kbdHint}]` : label}
      onClick={onClick}
      className="relative group w-5 h-5 rounded flex items-center justify-center transition-all duration-150 active:scale-90"
      style={{
        background: "rgba(255,140,0,0.08)",
        border:     "1px solid rgba(255,140,0,0.25)",
        color:      "#ff8c00",
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,140,0,0.22)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,140,0,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,140,0,0.08)";
      }}
    >
      {icon}
      {kbdHint && <KbdBadge label={kbdHint} />}
    </button>
  );
}

// ─── Keyboard hint badge (shows on hover) ─────────────────────────────────────

function KbdBadge({ label }: { label: string }) {
  return (
    <span
      className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2
                 opacity-0 group-hover:opacity-100 transition-opacity duration-150
                 text-[7px] font-mono px-1 rounded leading-none whitespace-nowrap z-10"
      style={{
        background: "rgba(5,12,20,0.92)",
        border:     "1px solid rgba(255,140,0,0.4)",
        color:      "#ff8c00",
      }}
    >
      {label}
    </span>
  );
}
