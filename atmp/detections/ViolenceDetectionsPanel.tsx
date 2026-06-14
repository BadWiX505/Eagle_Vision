"use client";
import { useDashboardStore } from "@/store/useDashboardStore";
import DetectionCard from "./DetectionCard";
import PersonIdentificationModal from "./PersonIdentificationModal";
import { ShieldAlert, Film } from "lucide-react";

export default function ViolenceDetectionsPanel() {
  const detections = useDashboardStore((s) => s.violenceDetections);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div
        className="flex items-center gap-3 px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,59,59,0.18)" }}
      >
        <ShieldAlert size={16} className="text-[#ff3b3b]" />
        <span className="font-mono font-bold text-sm tracking-[0.2em] text-white uppercase">
          Violence Evidence
        </span>

        {/* Count badge */}
        <span
          className="ml-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded"
          style={{
            color: detections.length > 0 ? "#ff3b3b" : "#4a6a8a",
            background:
              detections.length > 0 ? "rgba(255,59,59,0.12)" : "rgba(255,255,255,0.04)",
            border:
              detections.length > 0
                ? "1px solid rgba(255,59,59,0.35)"
                : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {detections.length} RECORD{detections.length !== 1 ? "S" : ""}
        </span>

        <span
          className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded"
          style={{
            color: "#ff8c00",
            background: "rgba(255,140,0,0.08)",
            border: "1px solid rgba(255,140,0,0.25)",
          }}
        >
          EVIDENCE ARCHIVE
        </span>
      </div>

      {/* Grid or empty state */}
      <div className="flex-1 overflow-y-auto p-4">
        {detections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
            <Film size={40} className="text-[#b8cde0]" />
            <span className="font-mono text-xs text-[#b8cde0] tracking-widest uppercase">
              No Violence Detections Stored
            </span>
            <span className="font-mono text-[10px] text-[#4a6a8a]">
              Snapshots appear here when violence is detected
            </span>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {detections.map((detection) => (
              <DetectionCard key={detection.id} detection={detection} />
            ))}
          </div>
        )}
      </div>

      {/* Modal — self-contained via store */}
      <PersonIdentificationModal />
    </div>
  );
}
