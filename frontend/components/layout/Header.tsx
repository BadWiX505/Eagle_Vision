"use client";
import { useEffect, useState } from "react";
import { Activity, Shield, Wifi, Maximize, Minimize, Focus } from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useFullscreen } from "@/lib/hooks/useFullscreen";

export default function Header() {
  const [time, setTime] = useState("");
  const alerts = useDashboardStore((s) => s.alerts);
  const mode = useDashboardStore((s) => s.mode);
  const videoFocused = useDashboardStore((s) => s.videoFocused);
  const setVideoFocused = useDashboardStore((s) => s.setVideoFocused);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const unread = alerts.filter((a) => !a.read).length;

  return (
    <header
      className="glass flex items-center justify-between px-6 h-14 shrink-0"
      style={{ borderBottom: "1px solid rgba(0,212,255,0.18)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Shield size={22} className="text-[#00d4ff] glow-cyan-text" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00d4ff] pulse-dot" />
        </div>
        <div>
          <span className="text-[#00d4ff] font-bold tracking-[0.25em] text-sm glow-cyan-text">
            EAGLE
          </span>
          <span className="text-white font-bold tracking-[0.25em] text-sm"> VISION</span>
        </div>
        <span
          className="ml-2 text-[10px] px-2 py-0.5 rounded border font-mono"
          style={{
            color: "#00d4ff",
            borderColor: "rgba(0,212,255,0.35)",
            background: "rgba(0,212,255,0.08)",
          }}
        >
          SURVEILLANCE SYSTEM v2.4
        </span>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-6 text-xs font-mono">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] pulse-dot" />
          <span className="text-[#00ff88] tracking-widest">LIVE</span>
        </div>

        {/* Mode */}
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-[#00d4ff]" />
          <span className="text-[#b8cde0]">MODE:</span>
          <span
            className="font-bold tracking-widest"
            style={{
              color:
                mode === "AUTO" ? "#00d4ff" : mode === "MANUAL" ? "#ff8c00" : "#8b5cf6",
            }}
          >
            {mode}
          </span>
        </div>

        {/* Alerts count */}
        {unread > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff3b3b] pulse-dot" />
            <span className="text-[#ff3b3b] tracking-wide">{unread} ALERTS</span>
          </div>
        )}

        {/* Network */}
        <div className="flex items-center gap-1 text-[#4a6680]">
          <Wifi size={12} />
          <span>NETWORK NOMINAL</span>
        </div>

        {/* Clock */}
        <div className="text-[#00d4ff] tabular-nums font-bold tracking-widest glow-cyan-text">
          {time}
        </div>

        {/* Focus mode toggle */}
        <button
          onClick={() => setVideoFocused(!videoFocused)}
          title={videoFocused ? "Exit focus mode" : "Focus on video"}
          className="flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200 font-mono text-[10px] tracking-widest"
          style={{
            background: videoFocused ? "rgba(0,212,255,0.14)" : "transparent",
            border: `1px solid ${videoFocused ? "rgba(0,212,255,0.45)" : "rgba(0,212,255,0.15)"}`,
            color: videoFocused ? "#00d4ff" : "#4a6680",
          }}
        >
          <Focus size={12} />
          <span className="hidden sm:inline">FOCUS</span>
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200 font-mono text-[10px] tracking-widest"
          style={{
            background: isFullscreen ? "rgba(139,92,246,0.14)" : "transparent",
            border: `1px solid ${isFullscreen ? "rgba(139,92,246,0.45)" : "rgba(0,212,255,0.15)"}`,
            color: isFullscreen ? "#8b5cf6" : "#4a6680",
          }}
        >
          {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
          <span className="hidden sm:inline">{isFullscreen ? "EXIT" : "FULL"}</span>
        </button>
      </div>
    </header>
  );
}
