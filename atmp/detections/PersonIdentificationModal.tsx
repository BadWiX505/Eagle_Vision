"use client";
import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { MOCK_PERSONS } from "@/lib/mock/persons";
import type { MockPerson } from "@/types";
import { X, Scan, User, CreditCard, Globe, AlertTriangle } from "lucide-react";

const RISK_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  high: {
    color: "#ff3b3b",
    bg: "rgba(255,59,59,0.12)",
    border: "rgba(255,59,59,0.4)",
    label: "HIGH RISK",
  },
  medium: {
    color: "#ff8c00",
    bg: "rgba(255,140,0,0.10)",
    border: "rgba(255,140,0,0.35)",
    label: "MEDIUM RISK",
  },
  low: {
    color: "#00ff88",
    bg: "rgba(0,255,136,0.08)",
    border: "rgba(0,255,136,0.3)",
    label: "LOW RISK",
  },
};

function pickRandomPersons(): MockPerson[] {
  const shuffled = [...MOCK_PERSONS].sort(() => Math.random() - 0.5);
  const count = Math.floor(Math.random() * 3) + 1; // 1 to 3
  return shuffled.slice(0, count);
}

export default function PersonIdentificationModal() {
  const identifyingDetectionId = useDashboardStore((s) => s.identifyingDetectionId);
  const setIdentifyingDetectionId = useDashboardStore((s) => s.setIdentifyingDetectionId);

  const [isScanning, setIsScanning] = useState(false);
  const [persons, setPersons] = useState<MockPerson[]>([]);

  useEffect(() => {
    if (identifyingDetectionId === null) {
      setPersons([]);
      setIsScanning(false);
      return;
    }
    // Start fake scan
    setIsScanning(true);
    setPersons([]);
    const timer = setTimeout(() => {
      setPersons(pickRandomPersons());
      setIsScanning(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [identifyingDetectionId]);

  if (identifyingDetectionId === null) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setIdentifyingDetectionId(null);
      }}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden font-mono"
        style={{
          background: "rgba(5,18,30,0.96)",
          border: "1px solid rgba(0,212,255,0.25)",
          boxShadow: "0 0 40px rgba(0,212,255,0.12)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(0,212,255,0.15)" }}
        >
          <div className="flex items-center gap-2">
            <Scan size={16} className="text-[#00d4ff]" />
            <span className="text-[#00d4ff] text-xs font-bold tracking-[0.2em] uppercase">
              Person Identification
            </span>
          </div>
          <button
            onClick={() => setIdentifyingDetectionId(null)}
            className="text-[#b8cde0] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Detection ID badge */}
        <div className="px-5 pt-3 pb-1">
          <span
            className="text-[10px] px-2 py-0.5 rounded"
            style={{
              color: "#b8cde0",
              background: "rgba(0,212,255,0.06)",
              border: "1px solid rgba(0,212,255,0.15)",
            }}
          >
            REF: {identifyingDetectionId}
          </span>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-3">
          {isScanning ? (
            /* Scanning state */
            <div className="flex flex-col items-center gap-4 py-10">
              <div
                className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(0,212,255,0.4)", borderTopColor: "#00d4ff" }}
              />
              <span className="text-[#00d4ff] text-xs tracking-[0.3em] animate-pulse">
                SCANNING DATABASE…
              </span>
              <span className="text-[10px] text-[#4a6a8a] tracking-wider">
                Cross-referencing biometric data
              </span>
            </div>
          ) : persons.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 opacity-50">
              <User size={28} className="text-[#b8cde0]" />
              <span className="text-[11px] text-[#b8cde0] tracking-widest">NO MATCHES FOUND</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-[#b8cde0] tracking-widest">
                  {persons.length} INDIVIDUAL{persons.length > 1 ? "S" : ""} IDENTIFIED
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{
                    color: "#ff8c00",
                    background: "rgba(255,140,0,0.1)",
                    border: "1px solid rgba(255,140,0,0.3)",
                  }}
                >
                  SIMULATED DATA
                </span>
              </div>

              {persons.map((person) => {
                const risk = RISK_STYLE[person.riskLevel];
                return (
                  <div
                    key={person.id}
                    className="rounded-xl p-4"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${risk.border}`,
                    }}
                  >
                    {/* Risk badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: risk.bg, border: `1px solid ${risk.border}` }}
                        >
                          <User size={14} style={{ color: risk.color }} />
                        </div>
                        <span className="text-white text-sm font-bold">{person.name}</span>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"
                        style={{ color: risk.color, background: risk.bg, border: `1px solid ${risk.border}` }}
                      >
                        <AlertTriangle size={9} />
                        {risk.label}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#4a6a8a] tracking-wider">IDENTITY CARD</span>
                        <div className="flex items-center gap-1">
                          <CreditCard size={10} className="text-[#00d4ff]" />
                          <span className="text-[#b8cde0]">{person.identityCard}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#4a6a8a] tracking-wider">AGE</span>
                        <span className="text-[#b8cde0]">{person.age} years old</span>
                      </div>
                      <div className="flex flex-col gap-0.5 col-span-2">
                        <span className="text-[#4a6a8a] tracking-wider">NATIONALITY</span>
                        <div className="flex items-center gap-1">
                          <Globe size={10} className="text-[#00d4ff]" />
                          <span className="text-[#b8cde0]">{person.nationality}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
