"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import type { ZoneConfig } from "@/lib/zone-config";
import { useCodecOverlay } from "@/hooks/useCodecOverlay";
import { useTransition } from "./TransitionContext";
import { getGameForRoute } from "@/lib/game-routes";

interface ZoneHeaderProps {
  zone: ZoneConfig;
  className?: string;
}

export default function ZoneHeader({ zone }: ZoneHeaderProps) {
  const { openCodec } = useCodecOverlay();
  const { replayGame } = useTransition();
  const pathname = usePathname();
  const gameConfig = getGameForRoute(pathname);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleCodecOpen = useCallback(() => {
    openCodec(zone.poCostume, zone.id);
  }, [openCodec, zone.poCostume, zone.id]);

  const handleCodecKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCodecOpen();
      }
    },
    [handleCodecOpen]
  );

  const handleGameOpen = useCallback(() => {
    if (gameConfig) replayGame(gameConfig);
  }, [gameConfig, replayGame]);

  const handleGameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleGameOpen();
      }
    },
    [handleGameOpen]
  );

  const sidebar = (
    <aside
      className="zone-sidebar"
      aria-label={`${zone.name} zone panel`}
    >
      {/* Zone name — vertical text, click to open codec */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleCodecOpen}
        onKeyDown={handleCodecKeyDown}
        aria-label={`${zone.subtitle} — talk to Po`}
        className="cursor-pointer group py-1"
      >
        <span
          className={`
            zone-sidebar-label font-pixel text-[7px] tracking-[0.3em] uppercase
            ${zone.accentColor} opacity-40 group-hover:opacity-80 transition-opacity
          `}
        >
          {zone.subtitle}
        </span>
      </div>

      {/* Divider dot */}
      <div className={`w-1 h-1 rounded-full ${zone.accentColor} opacity-20`} />

      {/* Game cartridge link */}
      {gameConfig && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleGameOpen}
          onKeyDown={handleGameKeyDown}
          aria-label={`Play ${gameConfig.label ?? gameConfig.gameName}`}
          className="zone-sidebar-game cursor-pointer group p-1.5"
        >
          {/* Play triangle */}
          <div
            className="
              w-0 h-0
              border-t-[5px] border-t-transparent
              border-b-[5px] border-b-transparent
              border-l-[8px] border-l-white/25
              group-hover:border-l-white/60 transition-colors
              ml-[2px]
            "
          />
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* sr-only h1 always in DOM for SEO + screen readers */}
      <h1 className="sr-only">{zone.name}</h1>

      {/* Portal sidebar to body to escape crt-boot containing block */}
      {mounted && createPortal(sidebar, document.body)}
    </>
  );
}
