"use client";
import { useDashboardStore } from "@/store/useDashboardStore";
import AlertItem from "./AlertItem";
import { Bell, BellOff } from "lucide-react";

export default function AlertsPanel() {
  const alerts = useDashboardStore((s) => s.alerts);
  const unread = alerts.filter((a) => !a.read).length;
  const highCount = alerts.filter((a) => a.severity === "high" && !a.read).length;

  return (
    <div className="glass rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(0,212,255,0.1)" }}
      >
        <div className="flex items-center gap-2 font-mono">
          {unread > 0 ? (
            <Bell size={13} className="text-[#ff3b3b]" />
          ) : (
            <BellOff size={13} className="text-[#4a6680]" />
          )}
          <span className="text-xs text-[#b8cde0] tracking-widest uppercase">
            Alerts
          </span>
          {unread > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(255,59,59,0.2)", color: "#ff3b3b" }}
            >
              {unread}
            </span>
          )}
        </div>

        {highCount > 0 && (
          <div
            className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded pulse-dot"
            style={{
              background: "rgba(255,59,59,0.12)",
              color: "#ff3b3b",
              border: "1px solid rgba(255,59,59,0.3)",
            }}
          >
            {highCount} CRITICAL
          </div>
        )}
      </div>

      {/* Alert severity summary */}
      <div
        className="grid grid-cols-3 gap-2 px-4 py-2 text-[10px] font-mono shrink-0"
        style={{ borderBottom: "1px solid rgba(0,212,255,0.06)" }}
      >
        {(["high", "medium", "low"] as const).map((sev) => {
          const count = alerts.filter((a) => a.severity === sev).length;
          const colors = {
            high: "#ff3b3b",
            medium: "#ff8c00",
            low: "#00d084",
          };
          return (
            <div key={sev} className="text-center">
              <div className="font-bold text-sm" style={{ color: colors[sev] }}>
                {count}
              </div>
              <div className="text-[#4a6680] uppercase tracking-widest">{sev}</div>
            </div>
          );
        })}
      </div>

      {/* Alert list */}
      <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 p-3">
        {alerts.length === 0 ? (
          <div className="text-center text-[#4a6680] text-xs font-mono py-8 tracking-widest">
            NO ALERTS
          </div>
        ) : (
          alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
        )}
      </div>
    </div>
  );
}
