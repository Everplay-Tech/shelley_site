"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
import type { GodotEvent } from "@/lib/godot-messages";

/* ─── Guitar showcase data (swap for real builds as photos come in) ─────── */

const guitars = [
  {
    name: "The Djinn",
    woods: "Wenge / Sitka Spruce",
    year: "2025",
    description: "Dark-toned parlor guitar with supernatural resonance. Inspired by the Djinn World.",
    status: "In Progress",
  },
  {
    name: "Smoke Ring",
    woods: "Mahogany / Cedar",
    year: "2025",
    description: "Warm, smoky midrange with fingerstyle-friendly action. Built for late-night sessions.",
    status: "Concept",
  },
  {
    name: "Gold Tooth",
    woods: "Maple / Engelmann Spruce",
    year: "2025",
    description: "Bright, articulate, with a gold-accented rosette. Cuts through any mix.",
    status: "Concept",
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function Gallery() {
  const pathname = usePathname();
  const gameConfig = getGameForRoute(pathname);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
  }, []);

  return (
    <div className="flex flex-col gap-16">
      {/* ─── HERO ─── */}
      <section className="text-center py-8">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">
          The <span className="text-shelley-amber">Gallery</span>
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto">
          Handcrafted instruments, daily builds, and the creative process —
          straight from the workshop.
        </p>
      </section>

      {/* ─── MINI-GAME (when available) ─── */}
      {gameConfig && (
        <section className="bg-white/5 rounded-3xl p-8 border border-white/10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-xl font-bold">{gameConfig.label}</h3>
              <p className="text-white/40 text-sm">Mini-game for this section</p>
            </div>
            <span className="text-xs font-mono text-shelley-amber bg-shelley-amber/10 px-2 py-1 rounded">
              GODOT 4.3 EMBED
            </span>
          </div>
          <GodotEmbed gameName={gameConfig.gameName} onEvent={handleGodotEvent} />
        </section>
      )}

      {/* ─── INSTAGRAM FEED ─── */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-xs font-mono text-white/40 tracking-[0.3em] uppercase">
            From the Workshop — @shelleyguitars
          </h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-shelley-amber/5 rounded-2xl border border-white/10 p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Instagram profile card */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-shelley-charcoal flex items-center justify-center">
                  <span className="text-2xl">🎸</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg">@shelleyguitars</h3>
                <p className="text-white/40 text-sm">Daily builds &amp; process</p>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Follow along as we build, break, and rebuild. New posts daily —
                wood selection, shaping, finishing, and the occasional
                philosophical tangent about the nature of sound.
              </p>
              <a
                href="https://www.instagram.com/shelleyguitars/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white font-bold text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                Follow on Instagram
              </a>
            </div>
          </div>

          {/* Placeholder grid for embedded posts (Phase 2: auto-pull via Graph API) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <a
                key={i}
                href="https://www.instagram.com/shelleyguitars/"
                target="_blank"
                rel="noopener noreferrer"
                className="group aspect-square bg-white/5 rounded-lg border border-white/5 hover:border-pink-500/30 transition-all flex items-center justify-center overflow-hidden"
              >
                <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  <span className="text-[9px] font-mono tracking-wider">VIEW POST</span>
                </div>
              </a>
            ))}
          </div>
          <p className="text-center text-white/20 text-xs font-mono mt-4">
            Live feed coming soon — once Instagram Graph API is connected, these will auto-update
          </p>
        </div>
      </section>

      {/* ─── GUITAR SHOWCASE ─── */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-xs font-mono text-white/40 tracking-[0.3em] uppercase">
            Guitar Builds
          </h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guitars.map((guitar) => (
            <div
              key={guitar.name}
              className="group flex flex-col gap-4 bg-white/5 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors overflow-hidden"
            >
              {/* Image placeholder */}
              <div className="aspect-[4/3] bg-white/[0.03] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 opacity-15 group-hover:opacity-25 transition-opacity">
                  <span className="text-3xl">🎸</span>
                  <span className="text-[9px] font-mono tracking-wider uppercase">
                    Photo Coming Soon
                  </span>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-white/90">
                    {guitar.name}
                  </h3>
                  <span className="text-[10px] font-mono text-shelley-amber/60 bg-shelley-amber/10 px-2 py-0.5 rounded">
                    {guitar.status}
                  </span>
                </div>
                <p className="text-xs font-mono text-white/30 mb-3">
                  {guitar.woods} &middot; {guitar.year}
                </p>
                <p className="text-white/50 text-sm leading-relaxed">
                  {guitar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
