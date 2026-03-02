"use client";

import { useState, useEffect } from "react";
import { hasCookie } from "@/lib/cookies";
import { ONBOARDING_COOKIE } from "@/lib/game-routes";
import PoSprite from "./PoSprite";

type SceneMode = "skyline" | "librarynth";

export default function FooterScene() {
  const [mode, setMode] = useState<SceneMode>("skyline");

  useEffect(() => {
    if (hasCookie(ONBOARDING_COOKIE)) {
      setMode("librarynth");
    }
  }, []);

  return (
    <div className="footer-scene relative w-full overflow-hidden">
      {mode === "skyline" ? <DjinnSkyline /> : <LibrarynthMap />}

      {/* Copyright bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3">
        <span className="font-pixel text-[7px] text-white/25 tracking-wider">
          &copy; 2026 SHELLEY GUITARS
        </span>
        <div className="hidden sm:flex items-center gap-4">
          <span className="font-pixel text-[7px] text-white/15">
            BUILT BY HAND
          </span>
          <span className="font-pixel text-[7px] text-shelley-amber/30">
            PLAYED WITH HEART
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── DJINN WORLD SKYLINE ───────────────────────────────────────────────────

function DjinnSkyline() {
  return (
    <div className="djinn-skyline relative h-[180px] sm:h-[240px]">
      {/* Horizon glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-[#1a0a20]/80 via-[#2d1040]/40 to-transparent" />

      {/* Back mountains + temple pagodas (pixel art) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[75%] opacity-90"
        style={{
          backgroundImage: "url(/sprites/skyline/skyline_back.png)",
          backgroundRepeat: "repeat-x",
          backgroundPosition: "center bottom",
          backgroundSize: "auto 100%",
          imageRendering: "pixelated",
        }}
      />

      {/* Mid bamboo forest treeline (pixel art) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[50%] opacity-80"
        style={{
          backgroundImage: "url(/sprites/skyline/skyline_mid.png)",
          backgroundRepeat: "repeat-x",
          backgroundPosition: "center bottom",
          backgroundSize: "auto 100%",
          imageRendering: "pixelated",
        }}
      />

      {/* Front ground silhouette (pixel art) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[25%] opacity-70"
        style={{
          backgroundImage: "url(/sprites/skyline/skyline_front.png)",
          backgroundRepeat: "repeat-x",
          backgroundPosition: "center bottom",
          backgroundSize: "auto 100%",
          imageRendering: "pixelated",
        }}
      />

      {/* Stars */}
      <div className="djinn-stars absolute inset-0 pointer-events-none" />

      {/* Po on moped — traverses the scene */}
      <div className="moped-rider absolute bottom-[15%] z-10">
        <PoSprite costume="moped" size={128} className="sm:hidden" />
        <PoSprite costume="moped" size={180} className="hidden sm:block" />
      </div>
    </div>
  );
}

// ─── LIBRARYNTH MAP ────────────────────────────────────────────────────────

function LibrarynthMap() {
  return (
    <div className="librarynth-map relative h-[120px] sm:h-[160px] flex items-end justify-center">
      {/* Ambient glow backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1225]/80 via-[#0d1a35]/40 to-transparent" />

      {/* Path of zones — horizontal flow */}
      <div className="relative z-10 flex items-end gap-1 sm:gap-2 px-4 pb-8 w-full max-w-lg mx-auto">
        <MapZone label="CRYSTAL CAVE" color="#4a90d9" heightPct={55} icon="◆" />
        <MapConnector />
        <MapZone label="LIBRARY" color="#6366f1" heightPct={65} icon="▣" />
        <MapConnector />
        <MapZone label="SPIRIT REALM" color="#8b5cf6" heightPct={75} icon="◈" />
        <MapConnector />
        <MapZone label="AMPHITHEATRE" color="#a78bfa" heightPct={85} icon="⊕" isHighlight />
      </div>

      {/* Map title */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <span className="font-pixel text-[6px] text-shelley-spirit-blue/30 tracking-[0.3em]">
          THE LIBRARYNTH
        </span>
      </div>
    </div>
  );
}

function MapZone({
  label,
  color,
  heightPct,
  icon,
  isHighlight = false,
}: {
  label: string;
  color: string;
  heightPct: number;
  icon: string;
  isHighlight?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div
        className={`w-full rounded-sm relative overflow-hidden ${isHighlight ? "map-zone-glow" : ""}`}
        style={{
          height: `${heightPct}px`,
          background: `linear-gradient(to top, ${color}15, ${color}08)`,
          border: `1px solid ${color}30`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] opacity-30" style={{ color }}>
            {icon}
          </span>
        </div>
      </div>
      <span
        className="font-pixel text-[5px] tracking-wider opacity-30 text-center hidden sm:block"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

function MapConnector() {
  return (
    <div className="w-3 sm:w-4 h-px bg-white/10 self-center mb-8 shrink-0" />
  );
}
