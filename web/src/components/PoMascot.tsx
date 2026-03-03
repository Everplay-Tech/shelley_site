"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import PoZoneAnimation from "./PoZoneAnimation";
import { getZoneForRoute, type PoCostumeId } from "@/lib/zone-config";
import { useGameEvents } from "@/hooks/useGameEvents";
import { useCodecOverlay } from "@/hooks/useCodecOverlay";

export default function PoMascot() {
  const pathname = usePathname();
  const zone = getZoneForRoute(pathname);
  const costume: PoCostumeId = zone?.poCostume ?? "default";
  const { openCodec } = useCodecOverlay();

  // Game event awareness (future: visual reactions)
  const [, setIsPlaying] = useState(false);
  useGameEvents((event) => {
    if (event.type === "game_ready") setIsPlaying(true);
    if (event.type === "onboarding_complete") setIsPlaying(false);
  });

  const handleClick = useCallback(() => {
    openCodec(costume, zone?.id ?? null);
  }, [openCodec, costume, zone]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <div
      className="relative flex items-center cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label="Talk to Po"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="animate-float">
        <PoZoneAnimation costume={costume} size={128} />
      </div>
    </div>
  );
}
