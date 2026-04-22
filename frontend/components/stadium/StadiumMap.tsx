"use client";
import { useDashboardStore } from "@/store/useDashboardStore";
import { MOCK_CAMERAS, MOCK_ZONES } from "@/lib/mock/cameras";

// Zone layout data for the SVG (top-view abstract stadium)
// viewBox: 0 0 300 280
const ZONE_PATHS = [
  // Zone A – North (top arc segment)
  {
    id: "zone-a",
    label: "A",
    d: "M 80,20 Q 150,5 220,20 L 200,95 Q 150,80 100,95 Z",
    cxLabel: 150,
    cyLabel: 50,
  },
  // Zone B – East (right arc segment)
  {
    id: "zone-b",
    label: "B",
    d: "M 220,20 Q 285,80 280,140 L 200,130 Q 195,90 200,95 Z",
    cxLabel: 248,
    cyLabel: 85,
  },
  // Zone C – South (bottom arc segment)
  {
    id: "zone-c",
    label: "C",
    d: "M 280,140 Q 285,210 220,260 L 200,185 Q 195,175 200,130 Z",
    cxLabel: 248,
    cyLabel: 195,
  },
  // Zone D – West (left arc segment)
  {
    id: "zone-d",
    label: "D",
    d: "M 80,260 Q 20,210 20,140 L 100,130 Q 105,175 100,185 Z",
    cxLabel: 52,
    cyLabel: 195,
  },
  // Zone E – South-west lower
  {
    id: "zone-e",
    label: "E",
    d: "M 20,140 Q 15,70 80,20 L 100,95 Q 105,90 100,130 Z",
    cxLabel: 52,
    cyLabel: 85,
  },
];

const ZONE_COLORS: Record<string, string> = {
  "zone-a": "#00d4ff",
  "zone-b": "#8b5cf6",
  "zone-c": "#0066ff",
  "zone-d": "#00ff88",
  "zone-e": "#ff8c00",
};

// Camera dot positions (approximate)
const CAM_DOTS: Record<string, { cx: number; cy: number }> = {
  "cam-001": { cx: 130, cy: 30 },
  "cam-002": { cx: 170, cy: 28 },
  "cam-003": { cx: 263, cy: 65 },
  "cam-004": { cx: 268, cy: 110 },
  "cam-005": { cx: 268, cy: 165 },
  "cam-006": { cx: 263, cy: 210 },
  "cam-007": { cx: 37, cy: 210 },
  "cam-008": { cx: 32, cy: 165 },
};

export default function StadiumMap() {
  const selectedZone = useDashboardStore((s) => s.selectedZone);
  const setSelectedZone = useDashboardStore((s) => s.setSelectedZone);
  const cameras = useDashboardStore((s) => s.cameras);
  const setSelectedCamera = useDashboardStore((s) => s.setSelectedCamera);

  const handleZoneClick = (zoneId: string) => {
    setSelectedZone(selectedZone === zoneId ? null : zoneId);
  };

  const handleCamDotClick = (camId: string) => {
    const cam = cameras.find((c) => c.id === camId);
    if (cam) setSelectedCamera(cam);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="text-[10px] text-[#4a6680] tracking-[0.2em] font-mono uppercase mb-1">
        Stadium Zones
      </div>

      {/* SVG stadium map */}
      <div
        className="glass rounded-lg p-2 flex items-center justify-center"
        style={{ minHeight: 200 }}
      >
        <svg
          viewBox="0 0 300 280"
          width="100%"
          height="100%"
          style={{ maxHeight: 210, display: "block" }}
        >
          {/* Outer stadium oval */}
          <ellipse
            cx="150"
            cy="140"
            rx="136"
            ry="130"
            fill="none"
            stroke="rgba(0,212,255,0.2)"
            strokeWidth="1.5"
          />
          {/* Inner pitch */}
          <ellipse
            cx="150"
            cy="140"
            rx="58"
            ry="52"
            fill="rgba(0,212,255,0.04)"
            stroke="rgba(0,212,255,0.25)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <text
            x="150"
            y="145"
            textAnchor="middle"
            fontSize="9"
            fill="rgba(0,212,255,0.4)"
            fontFamily="monospace"
          >
            PITCH
          </text>

          {/* Zone paths */}
          {ZONE_PATHS.map((zone) => {
            const isSelected = selectedZone === zone.id;
            const color = ZONE_COLORS[zone.id];
            const camCount = cameras.filter((c) => c.zone === zone.id).length;
            return (
              <g key={zone.id} onClick={() => handleZoneClick(zone.id)} style={{ cursor: "pointer" }}>
                <path
                  d={zone.d}
                  fill={isSelected ? `${color}30` : `${color}10`}
                  stroke={color}
                  strokeWidth={isSelected ? 2 : 0.8}
                  style={{
                    transition: "all 0.2s ease",
                    filter: isSelected ? `drop-shadow(0 0 6px ${color})` : "none",
                  }}
                />
                {/* Zone label */}
                <text
                  x={zone.cxLabel}
                  y={zone.cyLabel - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill={isSelected ? color : `${color}80`}
                  fontFamily="monospace"
                  style={{ transition: "fill 0.2s ease", pointerEvents: "none" }}
                >
                  {zone.label}
                </text>
                {/* Cam count badge */}
                {camCount > 0 && (
                  <text
                    x={zone.cxLabel}
                    y={zone.cyLabel + 7}
                    textAnchor="middle"
                    fontSize="7"
                    fill={isSelected ? color : "rgba(184,205,224,0.5)"}
                    fontFamily="monospace"
                    style={{ pointerEvents: "none" }}
                  >
                    {camCount} cam{camCount > 1 ? "s" : ""}
                  </text>
                )}
              </g>
            );
          })}

          {/* Camera dots */}
          {cameras.map((cam) => {
            const dot = CAM_DOTS[cam.id];
            if (!dot) return null;
            const isOnline = cam.status === "online";
            return (
              <g
                key={cam.id}
                onClick={() => handleCamDotClick(cam.id)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={dot.cx}
                  cy={dot.cy}
                  r="5"
                  fill={isOnline ? "rgba(0,212,255,0.2)" : "rgba(255,59,59,0.2)"}
                  stroke={isOnline ? "#00d4ff" : "#ff3b3b"}
                  strokeWidth="1.2"
                  style={{
                    filter: isOnline
                      ? "drop-shadow(0 0 3px rgba(0,212,255,0.7))"
                      : "drop-shadow(0 0 3px rgba(255,59,59,0.7))",
                  }}
                />
                <circle
                  cx={dot.cx}
                  cy={dot.cy}
                  r="2"
                  fill={isOnline ? "#00d4ff" : "#ff3b3b"}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Zone legend */}
      <div className="grid grid-cols-1 gap-1">
        {MOCK_ZONES.map((z) => {
          const camCount = cameras.filter((c) => c.zone === z.id).length;
          const isSelected = selectedZone === z.id;
          return (
            <button
              key={z.id}
              onClick={() => handleZoneClick(z.id)}
              className="flex items-center justify-between px-3 py-1.5 rounded text-xs font-mono transition-all duration-200"
              style={{
                background: isSelected ? `${z.color}18` : "rgba(13,25,40,0.6)",
                border: `1px solid ${isSelected ? z.color : "rgba(0,212,255,0.1)"}`,
                boxShadow: isSelected ? `0 0 10px ${z.color}30` : "none",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: z.color, boxShadow: `0 0 5px ${z.color}` }}
                />
                <span style={{ color: isSelected ? z.color : "#b8cde0" }}>
                  {z.label}
                </span>
                <span className="text-[#4a6680]">— {z.description}</span>
              </div>
              <span className="text-[#4a6680]">{camCount}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
