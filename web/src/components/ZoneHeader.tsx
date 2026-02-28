"use client";

import { useMemo } from "react";
import type { ZoneConfig } from "@/lib/zone-config";
import AmbientParticles from "./AmbientParticles";
import PoAside from "./PoAside";

interface ZoneHeaderProps {
  zone: ZoneConfig;
  className?: string;
}

export default function ZoneHeader({ zone, className = "" }: ZoneHeaderProps) {
  // Pick a random Po quote — stable for the page session
  const quote = useMemo(() => {
    const idx = Math.floor(Math.random() * zone.poQuotes.length);
    return zone.poQuotes[idx];
  }, [zone.poQuotes]);

  return (
    <section
      className={`relative overflow-hidden py-12 sm:py-16 text-center ${className}`}
    >
      {/* Ambient particles behind everything */}
      <AmbientParticles type={zone.particleType} count={8} />

      {/* Zone content */}
      <div className="relative z-10">
        {/* Subtitle label */}
        <p
          className={`font-pixel text-[7px] tracking-[0.4em] uppercase ${zone.accentColor} opacity-40 mb-3`}
        >
          {zone.subtitle}
        </p>

        {/* Zone name */}
        <h1
          className={`font-pixel text-lg sm:text-2xl text-white ${zone.glowClass} mb-3`}
        >
          {zone.name}
        </h1>

        {/* Tagline */}
        <p className="text-white/30 text-sm max-w-md mx-auto mb-8">
          {zone.tagline}
        </p>

        {/* Po aside */}
        <div className="flex justify-center">
          <PoAside quote={quote} variant="compact" />
        </div>
      </div>
    </section>
  );
}
