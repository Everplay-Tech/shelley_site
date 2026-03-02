"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import PoSprite from "./PoSprite";
import { getZoneForRoute, type PoCostumeId } from "@/lib/zone-config";
import { useGameEvents } from "@/hooks/useGameEvents";

const GENERIC_QUIPS = [
  "Don't mind me, just haunting.",
  "I forgot what I was doing.",
  "Ghost problems: walking through doors is too easy.",
  "Magus says I need to focus. Focus on what?",
  "I had something important to say... never mind.",
  "Is it weird that I can't feel my bones?",
];

export default function PoMascot() {
  const pathname = usePathname();
  const zone = getZoneForRoute(pathname);
  const costume: PoCostumeId = zone?.poCostume ?? "default";
  const quips = zone?.poQuotes ?? GENERIC_QUIPS;

  const [quip, setQuip] = useState<string | null>(null);
  const [showQuip, setShowQuip] = useState(false);

  // Game event awareness (future: visual reactions)
  const [, setIsPlaying] = useState(false);
  useGameEvents((event) => {
    if (event.type === "game_ready") setIsPlaying(true);
    if (event.type === "onboarding_complete") setIsPlaying(false);
  });

  const handleHover = useCallback(() => {
    const idx = Math.floor(Math.random() * quips.length);
    setQuip(quips[idx]);
    setShowQuip(true);
  }, [quips]);

  const handleLeave = useCallback(() => {
    setShowQuip(false);
  }, []);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={handleHover}
      onMouseLeave={handleLeave}
    >
      {/* Floating Po */}
      <div className="animate-float">
        <PoSprite costume={costume} size={128} />
      </div>

      {/* Hover quip tooltip — positioned left of Po */}
      {showQuip && quip && (
        <div
          className="absolute right-full mr-2 top-1/2 -translate-y-1/2
            pixel-panel-inset px-2.5 py-1.5 max-w-[200px] whitespace-normal
            pointer-events-none z-50"
        >
          <p className="font-pixel text-[6px] text-white/40 leading-relaxed">
            &ldquo;{quip}&rdquo;
          </p>
          {/* Speech arrow pointing right */}
          <div
            className="absolute top-1/2 -right-[6px] -translate-y-1/2
              w-0 h-0 border-t-[4px] border-t-transparent
              border-b-[4px] border-b-transparent
              border-l-[6px] border-l-white/5"
          />
        </div>
      )}
    </div>
  );
}
