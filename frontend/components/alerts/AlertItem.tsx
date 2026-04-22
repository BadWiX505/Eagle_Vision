"use client";
import type { Alert } from "@/types";
import { useDashboardStore } from "@/store/useDashboardStore";
import { AlertTriangle, Crosshair, Zap, Users } from "lucide-react";

interface Props {
  alert: Alert;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  weapon: <Crosshair size={11} />,
  violence: <AlertTriangle size={11} />,
  anomaly: <Zap size={11} />,
  crowd: <Users size={11} />,
};

const SEVERITY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  high: { color: "#ff3b3b", bg: "rgba(255,59,59,0.08)", border: "rgba(255,59,59,0.25)" },
  medium: { color: "#ff8c00", bg: "rgba(255,140,0,0.08)", border: "rgba(255,140,0,0.25)" },
  low: { color: "#00d084", bg: "rgba(0,208,132,0.06)", border: "rgba(0,208,132,0.2)" },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour12: false });
}

export default function AlertItem({ alert }: Props) {
  const setSelectedCamera = useDashboardStore((s) => s.setSelectedCamera);
  const cameras = useDashboardStore((s) => s.cameras);
  const markAlertRead = useDashboardStore((s) => s.markAlertRead);

  const style = SEVERITY_STYLES[alert.severity];

  const handleClick = () => {
    markAlertRead(alert.id);
    const cam = cameras.find((c) => c.id === alert.cameraId);
    if (cam) setSelectedCamera(cam);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left rounded-lg p-2.5 transition-all duration-200 alert-enter font-mono"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        opacity: alert.read ? 0.55 : 1,
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5" style={{ color: style.color }}>
          {TYPE_ICON[alert.type]}
          <span className="text-[10px] font-bold tracking-widest uppercase">
            {alert.type}
          </span>
          {!alert.read && (
            <span
              className="w-1.5 h-1.5 rounded-full pulse-dot"
              style={{ background: style.color }}
            />
          )}
        </div>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest uppercase"
          style={{ background: `${style.color}22`, color: style.color }}
        >
          {alert.severity}
        </span>
      </div>

      {/* Message */}
      <p className="text-[11px] text-[#b8cde0] mb-1.5 leading-snug">{alert.message}</p>

      {/* Meta */}
      <div className="flex items-center justify-between text-[9px] text-[#4a6680] tracking-wide">
        <span>{alert.cameraId.toUpperCase()} • {alert.zone.replace("-", " ").toUpperCase()}</span>
        <span>{formatTime(alert.timestamp)}</span>
      </div>
    </button>
  );
}
