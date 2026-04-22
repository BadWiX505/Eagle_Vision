"use client";
import { useDashboardStore } from "@/store/useDashboardStore";
import VideoPlayer from "./VideoPlayer";
import BoundingBoxOverlay from "./BoundingBoxOverlay";
import { Wifi, WifiOff, Compass, Minimize2, Maximize2 } from "lucide-react";

const DIRECTION_LABEL: Record<string, string> = {
  north: "N ↑",
  south: "S ↓",
  east: "E →",
  west: "W ←",
};

export default function CameraView() {
  const camera = useDashboardStore((s) => s.selectedCamera);
  const bboxes = useDashboardStore((s) => s.bboxes);
  const videoFocused = useDashboardStore((s) => s.videoFocused);
  const setVideoFocused = useDashboardStore((s) => s.setVideoFocused);

  if (!camera) {
    return (
      <div className="glass rounded-xl flex items-center justify-center h-full">
        <div className="text-center text-[#4a6680] font-mono">
          <div className="text-4xl mb-3 opacity-20">◉</div>
          <p className="text-xs tracking-widest">SELECT A CAMERA</p>
        </div>
      </div>
    );
  }

  const isOnline = camera.status === "online";

  return (
    <div className="glass rounded-xl flex flex-col h-full overflow-hidden">
      {/* Top metadata bar */}
      <div
        className="flex items-center justify-between px-4 py-2 text-xs font-mono shrink-0"
        style={{ borderBottom: "1px solid rgba(0,212,255,0.1)" }}
      >
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi size={12} className="text-[#00ff88]" />
          ) : (
            <WifiOff size={12} className="text-[#ff3b3b]" />
          )}
          <span className="text-[#00d4ff] font-bold tracking-wider">{camera.name}</span>
          <span className="text-[#4a6680]">{camera.id.toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-4 text-[#4a6680]">
          <span className="flex items-center gap-1">
            <Compass size={10} />
            {DIRECTION_LABEL[camera.direction]}
          </span>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest"
            style={{
              background: isOnline ? "rgba(0,255,136,0.1)" : "rgba(255,59,59,0.1)",
              color: isOnline ? "#00ff88" : "#ff3b3b",
              border: `1px solid ${isOnline ? "rgba(0,255,136,0.3)" : "rgba(255,59,59,0.3)"}`,
            }}
          >
            {camera.status.toUpperCase()}
          </span>
          {isOnline && (
            <span className="text-[#ff3b3b] text-[10px] tracking-widest font-bold pulse-dot">
              ● REC
            </span>
          )}

          {/* Focus toggle */}
          <button
            onClick={() => setVideoFocused(!videoFocused)}
            title={videoFocused ? "Restore panels" : "Expand video"}
            className="ml-2 p-1 rounded transition-all duration-200"
            style={{
              background: videoFocused ? "rgba(0,212,255,0.12)" : "rgba(0,212,255,0.05)",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "#00d4ff",
            }}
          >
            {videoFocused ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
        </div>
      </div>

      {/* Video + canvas overlay — key causes fade-in on camera switch */}
      <div key={camera.id} className="relative flex-1 min-h-0 bg-[#050c14] fade-in">
        <VideoPlayer streamUrl={camera.streamUrl} />
        {isOnline && bboxes.length > 0 && (
          <BoundingBoxOverlay boxes={bboxes} width={640} height={360} />
        )}

        {/* Zone badge */}
        <div
          className="absolute bottom-3 left-3 text-[10px] font-mono tracking-widest px-2 py-1 rounded"
          style={{
            background: "rgba(5,12,20,0.8)",
            border: "1px solid rgba(0,212,255,0.25)",
            color: "#00d4ff",
          }}
        >
          {camera.zone.replace("-", " ").toUpperCase()}
        </div>

        {/* Offline overlay */}
        {!isOnline && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(5,12,20,0.85)] z-20">
            <div className="text-center font-mono">
              <WifiOff size={32} className="text-[#ff3b3b] mx-auto mb-2 opacity-60" />
              <p className="text-[#ff3b3b] text-sm tracking-widest">SIGNAL LOST</p>
              <p className="text-[#4a6680] text-[10px] mt-1">{camera.id.toUpperCase()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom stream info */}
      <div
        className="flex items-center justify-between px-4 py-1.5 text-[10px] font-mono text-[#4a6680] shrink-0"
        style={{ borderTop: "1px solid rgba(0,212,255,0.08)" }}
      >
        <span>{camera.streamUrl}</span>
        {bboxes.length > 0 && (
          <span className="text-[#ff8c00]">{bboxes.length} detection{bboxes.length > 1 ? "s" : ""}</span>
        )}
      </div>
    </div>
  );
}
