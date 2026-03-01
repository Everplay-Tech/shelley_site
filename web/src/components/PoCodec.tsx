"use client";

import { useState, useEffect, useRef } from "react";
import { PO_COSTUMES, type PoCostumeId } from "@/lib/zone-config";
import PoSprite from "./PoSprite";

interface PoCodecProps {
  quote: string;
  costume?: PoCostumeId;
  variant?: "default" | "compact";
  className?: string;
}

export default function PoCodec({
  quote,
  costume = "default",
  variant = "default",
  className = "",
}: PoCodecProps) {
  const config = PO_COSTUMES[costume];
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Typewriter reveal
  useEffect(() => {
    setDisplayedText("");
    setShowCursor(true);
    let i = 0;

    intervalRef.current = setInterval(() => {
      i++;
      if (i <= quote.length) {
        setDisplayedText(quote.slice(0, i));
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Blink cursor a few times then hide
        setTimeout(() => setShowCursor(false), 1500);
      }
    }, 30);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [quote]);

  const isCompact = variant === "compact";
  const spriteSize = isCompact ? 40 : 56;

  return (
    <div
      className={`po-codec relative overflow-hidden ${
        isCompact ? "max-w-md" : "max-w-lg"
      } ${className}`}
    >
      {/* Scanline overlay */}
      <div className="po-codec-scanlines absolute inset-0 pointer-events-none z-10" />

      <div className={`flex items-start gap-3 ${isCompact ? "p-2.5" : "p-3"}`}>
        {/* Portrait frame */}
        <div className="po-codec-portrait relative shrink-0">
          <div className={`relative overflow-hidden ${
            isCompact ? "w-[44px] h-[44px]" : "w-[60px] h-[60px]"
          }`}>
            {/* Portrait background */}
            <div className="absolute inset-0 bg-black/60" />
            {/* Sprite */}
            <div className="relative flex items-center justify-center w-full h-full">
              <PoSprite costume={costume} size={spriteSize} />
            </div>
            {/* Portrait scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.15) 1px, rgba(0,0,0,0.15) 2px)",
            }} />
          </div>
          {/* Name plate */}
          <div className={`text-center mt-1`}>
            <span className={`font-pixel ${
              isCompact ? "text-[5px]" : "text-[6px]"
            } text-shelley-amber/60 tracking-widest`}>
              {config.label.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Dialogue area */}
        <div className="flex-1 min-w-0">
          {/* Speaker label */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`font-pixel ${
              isCompact ? "text-[6px]" : "text-[7px]"
            } text-shelley-amber crt-glow tracking-wider`}>
              PO
            </span>
            <div className="flex-1 h-px bg-shelley-amber/10" />
          </div>

          {/* Quote with typewriter */}
          <p className={`font-pixel ${
            isCompact ? "text-[6px] leading-[1.8]" : "text-[7px] leading-[1.8]"
          } text-white/50`}>
            &ldquo;{displayedText}
            {showCursor && (
              <span className="inline-block w-[4px] h-[8px] bg-shelley-amber/70 ml-[1px] animate-blink-cursor align-middle" />
            )}
            {!showCursor && <>&rdquo;</>}
          </p>
        </div>
      </div>
    </div>
  );
}
