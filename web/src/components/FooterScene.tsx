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

      {/* Social links */}
      <div className="relative z-10 flex items-center justify-center gap-4 px-6 pt-3 pb-1">
        <a
          href="https://www.instagram.com/shelleyguitar/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="text-white/25 hover:text-pink-400 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        </a>
        <a
          href="https://discord.gg/b9cJp9mgS2"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Discord"
          className="text-white/25 hover:text-[#5865F2] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
          </svg>
        </a>
        <a
          href="https://www.youtube.com/channel/UCbyUxWBCfUC10bJw7ujRBnQ"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
          className="text-white/25 hover:text-red-400 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </a>
      </div>

      {/* Copyright bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-2">
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
        <PoSprite costume="moped" size={128} className="hidden sm:block" />
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
