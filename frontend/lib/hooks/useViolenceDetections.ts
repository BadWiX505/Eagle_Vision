import { useEffect, useRef } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { MOCK_VIOLENCE_DETECTIONS } from "@/lib/mock/detections";

const POLL_INTERVAL_MS = 30_000;
const API_URL = "http://localhost:5000/api/detections/violence";

export function useViolenceDetections() {
  const setViolenceDetections = useDashboardStore((s) => s.setViolenceDetections);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchDetections() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setViolenceDetections(data);
    } catch {
      // Backend unreachable — use mock data so the Evidence tab always works
      setViolenceDetections(MOCK_VIOLENCE_DETECTIONS);
    }
  }

  useEffect(() => {
    fetchDetections();
    intervalRef.current = setInterval(fetchDetections, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
