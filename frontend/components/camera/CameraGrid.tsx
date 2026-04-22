"use client";
import { useDashboardStore } from "@/store/useDashboardStore";
import CameraCard from "./CameraCard";
import { MOCK_ZONES } from "@/lib/mock/cameras";

export default function CameraGrid() {
  const cameras = useDashboardStore((s) => s.cameras);
  const selectedZone = useDashboardStore((s) => s.selectedZone);

  const filtered = selectedZone
    ? cameras.filter((c) => c.zone === selectedZone)
    : cameras;

  const activeZone = MOCK_ZONES.find((z) => z.id === selectedZone);

  return (
    <div className="flex flex-col gap-2 min-h-0 flex-1 overflow-hidden">
      <div className="flex items-center justify-between text-[10px] text-[#4a6680] tracking-[0.2em] font-mono uppercase">
        <span>Cameras</span>
        {activeZone ? (
          <span style={{ color: activeZone.color }}>
            {activeZone.label} • {filtered.length}
          </span>
        ) : (
          <span>{filtered.length} total</span>
        )}
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-0.5">
        {filtered.length === 0 ? (
          <div className="text-center text-[#4a6680] text-xs py-6 font-mono">
            No cameras in zone
          </div>
        ) : (
          filtered.map((cam) => <CameraCard key={cam.id} camera={cam} />)
        )}
      </div>
    </div>
  );
}
