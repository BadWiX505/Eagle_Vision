"use client";
import { useRef, useEffect } from "react";

interface Props {
  streamUrl: string;
  onVideoRef?: (el: HTMLVideoElement | null) => void;
}

export default function VideoPlayer({ streamUrl, onVideoRef }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (onVideoRef) onVideoRef(videoRef.current);
  }, [onVideoRef]);

  // Determine stream type from URL hint
  const isHLS = streamUrl.endsWith(".m3u8");
  const isMJPEG = streamUrl.startsWith("http") && !isHLS;
  const isMock = streamUrl.startsWith("/mock/");

  if (isMock) {
    // Render a convincing mock video feed placeholder
    return (
      <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[#050c14]">
        {/* Animated CRT scanlines */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.04) 3px, rgba(0,212,255,0.04) 4px)",
          }}
        />
        {/* Perspective grid */}
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        {/* Center label */}
        <div className="flex flex-col items-center gap-3 z-20 select-none">
          <div className="w-16 h-16 rounded-full border-2 border-[rgba(0,212,255,0.3)] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#00d4ff] pulse-dot" />
          </div>
          <span className="text-[#00d4ff] text-xs font-mono tracking-[0.3em] opacity-70">
            STREAM READY
          </span>
          <span className="text-[#4a6680] text-[10px] font-mono tracking-widest">
            {streamUrl}
          </span>
        </div>
        {/* Corner brackets */}
        {[
          "top-2 left-2 border-t-2 border-l-2",
          "top-2 right-2 border-t-2 border-r-2",
          "bottom-2 left-2 border-b-2 border-l-2",
          "bottom-2 right-2 border-b-2 border-r-2",
        ].map((cls, i) => (
          <div
            key={i}
            className={`absolute w-6 h-6 ${cls} pointer-events-none z-20`}
            style={{ borderColor: "rgba(0,212,255,0.5)" }}
          />
        ))}
      </div>
    );
  }

  if (isMJPEG) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={streamUrl}
        alt="MJPEG stream"
        className="w-full h-full object-cover"
      />
    );
  }

  // HLS or regular video (mp4 etc.)
  return (
    <video
      ref={videoRef}
      src={streamUrl}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover"
    />
  );
}
