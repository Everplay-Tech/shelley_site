"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import type { ZoneConfig } from "@/lib/zone-config";
import { useCodecOverlay } from "@/hooks/useCodecOverlay";
import { useTransition } from "./TransitionContext";
import { getGameForRoute } from "@/lib/game-routes";
import GameCartridge from "./GameCartridge";

const PoZoneAnimation = dynamic(() => import("./PoZoneAnimation"), {
  ssr: false,
});

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

  const sidebar = (
    <aside
      className="zone-sidebar"
      aria-label={`${zone.name} zone panel`}
    >
      {/* Po Animation */}
      <div className="flex justify-center">
        <PoZoneAnimation costume={zone.poCostume} size={64} />
      </div>

      {/* Zone name */}
      <p
        className={`
          font-pixel text-[8px] tracking-wider text-center uppercase
          ${zone.accentColor} opacity-60
        `}
      >
        {zone.subtitle}
      </p>

      {/* Divider */}
      <div className={`w-full h-px ${zone.accentColor} opacity-10`} />

      {/* Game Cartridge */}
      {gameConfig && (
        <GameCartridge
          game={gameConfig}
          accentColor={zone.accentColor}
          accentHex={zone.accentHex}
          coverImage={zone.cartridgeImage}
          className="w-full"
        />
      )}

      {/* Divider */}
      <div className={`w-full h-px ${zone.accentColor} opacity-10`} />

      {/* Talk to Po button */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleCodecOpen}
        onKeyDown={handleCodecKeyDown}
        aria-label={`Talk to Po about ${zone.name}`}
        className="cursor-pointer group w-full text-center py-1.5"
      >
        <span className="font-pixel text-[6px] tracking-widest text-white/30 group-hover:text-white/60 transition-colors uppercase">
          Talk to Po
        </span>
      </div>
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
