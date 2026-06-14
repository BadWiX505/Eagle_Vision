"use client";
import { useState } from "react";
import type { ViolenceDetection } from "@/types";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Camera, MapPin, Crosshair, Clock } from "lucide-react";

interface Props {
  detection: ViolenceDetection;
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour12: false }),
  };
}

function confidenceColor(conf: number): string {
  if (conf >= 0.9) return "#ff3b3b";
  if (conf >= 0.75) return "#ff8c00";
  return "#ffcc00";
}

export default function DetectionCard({ detection }: Props) {
  const setIdentifyingDetectionId = useDashboardStore((s) => s.setIdentifyingDetectionId);
  const [imgError, setImgError] = useState(false);
  const { date, time } = formatDateTime(detection.timestamp);
  const confColor = confidenceColor(detection.confidence);

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden font-mono"
      style={{
        background: "rgba(5,18,30,0.85)",
        border: "1px solid rgba(255,59,59,0.22)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Cropped snapshot */}
      <div
        className="relative flex items-center justify-center"
        style={{
          background: "rgba(0,0,0,0.6)",
          minHeight: 140,
          borderBottom: "1px solid rgba(255,59,59,0.15)",
        }}
      >
        {!imgError ? (
          <img
            src={`http://localhost:5000${detection.imageUrl}`}
            alt={`Violence detection ${detection.id}`}
            onError={() => setImgError(true)}
            className="object-contain w-full"
            style={{ maxHeight: 160 }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 opacity-40">
            <Crosshair size={28} className="text-[#ff3b3b]" />
            <span className="text-[10px] text-[#b8cde0] tracking-widest">NO PREVIEW</span>
          </div>
        )}

        {/* Confidence badge */}
        <span
          className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded"
          style={{
            color: confColor,
            background: "rgba(0,0,0,0.75)",
            border: `1px solid ${confColor}`,
          }}
        >
          {(detection.confidence * 100).toFixed(1)}%
        </span>
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-2 p-3">
        {/* Date / Time */}
        <div className="flex items-center gap-2 text-[11px]">
          <Clock size={11} className="text-[#00d4ff] shrink-0" />
          <span className="text-[#b8cde0]">{date}</span>
          <span className="text-[#00d4ff] font-bold ml-auto">{time}</span>
        </div>

        {/* Camera */}
        <div className="flex items-center gap-2 text-[11px]">
          <Camera size={11} className="text-[#00d4ff] shrink-0" />
          <span className="text-[#b8cde0]">CAMERA</span>
          <span className="text-white font-bold ml-auto tracking-widest uppercase">
            {detection.cameraId}
          </span>
        </div>

        {/* Zone */}
        <div className="flex items-center gap-2 text-[11px]">
          <MapPin size={11} className="text-[#00d4ff] shrink-0" />
          <span className="text-[#b8cde0]">ZONE</span>
          <span className="text-white font-bold ml-auto tracking-widest uppercase">
            {detection.zone}
          </span>
        </div>

        {/* Identify button */}
        <button
          onClick={() => setIdentifyingDetectionId(detection.id)}
          className="mt-1 w-full py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all duration-200"
          style={{
            background: "rgba(255,59,59,0.1)",
            border: "1px solid rgba(255,59,59,0.45)",
            color: "#ff3b3b",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,59,59,0.2)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(255,59,59,0.35)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,59,59,0.1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          IDENTIFY PERSONS
        </button>
      </div>
    </div>
  );
}
