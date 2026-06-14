import type { BoundingBox } from "@/types";

const LABELS = ["person", "weapon", "bag", "crowd", "vehicle"];

export function generateMockBboxes(
  count: number = 3,
  frameWidth: number = 640,
  frameHeight: number = 360
): BoundingBox[] {
  return Array.from({ length: count }, () => {
    const w = Math.floor(Math.random() * 80 + 40);
    const h = Math.floor(Math.random() * 100 + 50);
    return {
      x: Math.floor(Math.random() * (frameWidth - w)),
      y: Math.floor(Math.random() * (frameHeight - h)),
      w,
      h,
      label: LABELS[Math.floor(Math.random() * LABELS.length)],
      confidence: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)),
    };
  });
}
