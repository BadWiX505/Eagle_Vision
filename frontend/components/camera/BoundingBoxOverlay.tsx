"use client";
import { useRef, useEffect } from "react";
import type { BoundingBox } from "@/types";

interface Props {
  boxes: BoundingBox[];
  width: number;
  height: number;
}

const LABEL_COLORS: Record<string, string> = {
  weapon: "#ff3b3b",
  violence: "#ff3b3b",
  person: "#00d4ff",
  crowd: "#ff8c00",
  bag: "#8b5cf6",
  vehicle: "#00ff88",
};

function getColor(label: string): string {
  return LABEL_COLORS[label.toLowerCase()] ?? "#00d4ff";
}

export default function BoundingBoxOverlay({ boxes, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const box of boxes) {
      // Scale boxes from reference frame (640×360) to actual canvas size
      const scaleX = canvas.width / width;
      const scaleY = canvas.height / height;
      const x = box.x * scaleX;
      const y = box.y * scaleY;
      const w = box.w * scaleX;
      const h = box.h * scaleY;

      const color = getColor(box.label);

      // Glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      // Bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);

      // Corner marks
      const cs = Math.min(w, h, 14);
      ctx.lineWidth = 2.5;
      // TL
      ctx.beginPath(); ctx.moveTo(x, y + cs); ctx.lineTo(x, y); ctx.lineTo(x + cs, y); ctx.stroke();
      // TR
      ctx.beginPath(); ctx.moveTo(x + w - cs, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cs); ctx.stroke();
      // BL
      ctx.beginPath(); ctx.moveTo(x, y + h - cs); ctx.lineTo(x, y + h); ctx.lineTo(x + cs, y + h); ctx.stroke();
      // BR
      ctx.beginPath(); ctx.moveTo(x + w - cs, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cs); ctx.stroke();

      ctx.shadowBlur = 0;

      // Label background
      const label = `${box.label.toUpperCase()} ${Math.round(box.confidence * 100)}%`;
      ctx.font = "bold 10px 'Courier New', monospace";
      const textWidth = ctx.measureText(label).width;
      const padX = 5;
      const padY = 3;
      const labelH = 14;
      const labelY = y > labelH + 4 ? y - labelH - 2 : y + h + 2;

      ctx.fillStyle = `${color}cc`;
      ctx.fillRect(x, labelY, textWidth + padX * 2, labelH + padY);

      ctx.fillStyle = "#050c14";
      ctx.fillText(label, x + padX, labelY + labelH - 1);
    }
  }, [boxes, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10, transition: "opacity 0.25s ease" }}
    />
  );
}
