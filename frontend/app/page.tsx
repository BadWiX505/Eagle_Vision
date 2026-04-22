"use client";
import { useDetectionStream } from "@/lib/hooks/useDetectionStream";
import { useDashboardStore } from "@/store/useDashboardStore";
import Header from "@/components/layout/Header";
import StadiumMap from "@/components/stadium/StadiumMap";
import CameraGrid from "@/components/camera/CameraGrid";
import CameraView from "@/components/camera/CameraView";
import AlertsPanel from "@/components/alerts/AlertsPanel";
import ControlPanel from "@/components/controls/ControlPanel";

export default function DashboardPage() {
  useDetectionStream();

  const videoFocused = useDashboardStore((s) => s.videoFocused);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050c14]">
      <Header />
      <div className="flex flex-1 gap-2 p-2 min-h-0 overflow-hidden">

        {/* Left panel — collapses in focus mode */}
        <aside
          className="glass rounded-xl flex flex-col gap-3 p-3 shrink-0 overflow-hidden"
          style={{
            width: videoFocused ? 0 : 260,
            padding: videoFocused ? 0 : undefined,
            opacity: videoFocused ? 0 : 1,
            pointerEvents: videoFocused ? "none" : "auto",
            transition: "width 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease, padding 0.4s ease",
            overflow: "hidden",
          }}
        >
          <div className="panel-enter" style={{ minWidth: 236 }}>
            <StadiumMap />
            <div className="w-full h-px bg-[rgba(0,212,255,0.1)] my-3" />
            <CameraGrid />
          </div>
        </aside>

        {/* Center — video */}
        <main className="flex-1 min-w-0">
          <CameraView />
        </main>

        {/* Right panel — collapses in focus mode */}
        <aside
          className="shrink-0 overflow-hidden"
          style={{
            width: videoFocused ? 0 : 280,
            opacity: videoFocused ? 0 : 1,
            pointerEvents: videoFocused ? "none" : "auto",
            transition: "width 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
          }}
        >
          <div style={{ width: 280 }} className="panel-enter h-full">
            <AlertsPanel />
          </div>
        </aside>

      </div>
      <ControlPanel />
    </div>
  );
}
