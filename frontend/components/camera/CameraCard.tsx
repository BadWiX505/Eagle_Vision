"use client";
import { Camera, Video, VideoOff } from "lucide-react";
import type { Camera as CameraType } from "@/types";
import { useDashboardStore } from "@/store/useDashboardStore";
import clsx from "clsx";

interface Props {
  camera: CameraType;
}

const DIRECTION_ARROW: Record<string, string> = {
  north: "↑",
  south: "↓",
  east: "→",
  west: "←",
};

export default function CameraCard({ camera }: Props) {
  const selectedCamera = useDashboardStore((s) => s.selectedCamera);
  const setSelectedCamera = useDashboardStore((s) => s.setSelectedCamera);

  const isSelected = selectedCamera?.id === camera.id;
  const isOnline = camera.status === "online";

  return (
    <button
      onClick={() => setSelectedCamera(camera)}
      className={clsx(
        "w-full text-left rounded-lg p-3 transition-all duration-200 font-mono",
        "hover:border-[#00d4ff40] hover:bg-[rgba(0,212,255,0.05)]"
      )}
      style={{
        background: isSelected ? "rgba(0,212,255,0.08)" : "rgba(10,21,32,0.8)",
        border: `1px solid ${isSelected ? "rgba(0,212,255,0.5)" : "rgba(0,212,255,0.1)"}`,
        boxShadow: isSelected ? "0 0 16px rgba(0,212,255,0.15)" : "none",
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Video size={12} className="text-[#00d4ff]" />
          ) : (
            <VideoOff size={12} className="text-[#ff3b3b]" />
          )}
          <span
            className="text-xs font-bold tracking-wide"
            style={{ color: isSelected ? "#00d4ff" : "#b8cde0" }}
          >
            {camera.name}
          </span>
        </div>
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: isOnline ? "#00ff88" : "#ff3b3b",
            boxShadow: isOnline ? "0 0 5px #00ff88" : "0 0 5px #ff3b3b",
          }}
        />
      </div>

      {/* Mock thumbnail */}
      <div
        className="w-full h-14 rounded mb-2 flex items-center justify-center relative overflow-hidden"
        style={{ background: "#050c14", border: "1px solid rgba(0,212,255,0.08)" }}
      >
        {isOnline ? (
          <>
            {/* Simulated scanlines */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.15) 2px, rgba(0,212,255,0.15) 4px)",
              }}
            />
            <Camera size={16} className="text-[#00d4ff] opacity-40" />
            {isSelected && (
              <span className="absolute top-1 right-1 text-[8px] text-[#ff3b3b] font-bold tracking-widest">
                LIVE
              </span>
            )}
          </>
        ) : (
          <span className="text-[10px] text-[#ff3b3b] tracking-widest">NO SIGNAL</span>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-[9px] text-[#4a6680] tracking-wide">
        <span>{camera.id.toUpperCase()}</span>
        <span>{DIRECTION_ARROW[camera.direction]} {camera.direction.toUpperCase()}</span>
      </div>
    </button>
  );
}
