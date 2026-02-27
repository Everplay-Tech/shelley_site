"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import PixelSectionHeader from "@/components/PixelSectionHeader";
import PixelCard from "@/components/PixelCard";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
import type { GodotEvent } from "@/lib/godot-messages";

/* ─── Guitar showcase data ───────────────────────────────────────────────── */

const guitars = [
  {
    name: "The Djinn",
    woods: "Wenge / Sitka Spruce",
    year: "2025",
    description: "Dark-toned parlor guitar with supernatural resonance. Scalloped X-bracing voiced for the low end. Inspired by the Djinn World.",
    status: "Building",
  },
  {
    name: "Smoke Ring",
    woods: "Mahogany / Cedar",
    year: "2025",
    description: "Warm, smoky midrange with fingerstyle-friendly action. Cedar top for immediate response. Built for late-night sessions.",
    status: "Design",
  },
  {
    name: "Gold Tooth",
    woods: "Maple / Engelmann Spruce",
    year: "2026",
    description: "Bright, articulate, with a gold-accented rosette. Hard maple back and sides for projection that cuts through any mix.",
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
        <h1 className="font-pixel text-lg sm:text-2xl tracking-wider mb-4 crt-glow">
          THE <span className="text-shelley-amber">GALLERY</span>
        </h1>
        <p className="text-sm text-white/45 max-w-xl mx-auto leading-relaxed">
          Handcrafted instruments, daily builds, and the creative process —
          straight from the workshop.
        </p>
      </section>

      {/* ─── GALLERY RUN ─── */}
      {gameConfig && (
        <section className="pixel-panel p-5 sm:p-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-pixel text-[10px] text-purple-300 crt-glow-purple tracking-wider">GALLERY RUN</h3>
              <p className="text-white/40 text-xs mt-1">
                Pilot the Axis Mundi and defend the gallery from haunted artwork
              </p>
            </div>
            <span className="font-pixel text-[7px] text-white/20 hidden sm:block">
              ARROWS &middot; SPACE FIRE
            </span>
          </div>
          <GodotEmbed gameName={gameConfig.gameName} onEvent={handleGodotEvent} />
        </section>
      )}

      {/* ─── INSTAGRAM FEED ─── */}
      <section>
        <PixelSectionHeader color="purple">@shelleyguitars</PixelSectionHeader>

        <PixelCard variant="raised" hover={false}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Instagram profile card */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-shelley-charcoal flex items-center justify-center">
                  <span className="text-xl">&#127928;</span>
                </div>
              </div>
              <div>
                <h3 className="font-pixel text-[9px] text-white/80 tracking-wider">@SHELLEYGUITARS</h3>
                <p className="text-white/35 text-xs">Daily builds &amp; process</p>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="text-white/45 text-sm leading-relaxed mb-4">
                Follow along as we build, break, and rebuild. New posts daily —
                wood selection, shaping, finishing, and the occasional
                philosophical tangent about the nature of sound.
              </p>
              <a
                href="https://www.instagram.com/shelleyguitars/"
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn"
              >
                FOLLOW ON INSTAGRAM
              </a>
            </div>
          </div>

          {/* Placeholder grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <a
                key={i}
                href="https://www.instagram.com/shelleyguitars/"
                target="_blank"
                rel="noopener noreferrer"
                className="group aspect-square pixel-panel-inset flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-1 opacity-15 group-hover:opacity-30 transition-opacity">
                  <span className="font-pixel text-[7px] text-white/40">VIEW</span>
                </div>
              </a>
            ))}
          </div>
          <p className="text-center font-pixel text-[7px] text-white/15 mt-3 tracking-wider">
            LIVE FEED COMING SOON
          </p>
        </PixelCard>
      </section>

      {/* ─── WHAT MAKES A SHELLEY ─── */}
      <section>
        <PixelSectionHeader>What Makes a Shelley Guitar</PixelSectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PixelCard>
            <h4 className="font-pixel text-[8px] text-white/70 mb-2 tracking-wider">HAND-VOICED BRACING</h4>
            <p className="text-white/40 text-sm leading-relaxed">
              Every brace is scalloped and tap-tuned by ear. No CNC, no templates.
              The top is shaped to respond to the specific wood&apos;s resonance.
            </p>
          </PixelCard>
          <PixelCard>
            <h4 className="font-pixel text-[8px] text-white/70 mb-2 tracking-wider">PLAYER-FIRST DESIGN</h4>
            <p className="text-white/40 text-sm leading-relaxed">
              Neck profiles carved to the player&apos;s hand. Action set to their style.
              Every Shelley guitar is built for a specific person, not a shelf.
            </p>
          </PixelCard>
          <PixelCard>
            <h4 className="font-pixel text-[8px] text-white/70 mb-2 tracking-wider">THIN FINISH, BIG SOUND</h4>
            <p className="text-white/40 text-sm leading-relaxed">
              Ultra-thin lacquer or hand-rubbed oil. We never choke a top with thick poly.
              The finish protects without muting the wood&apos;s natural voice.
            </p>
          </PixelCard>
        </div>
      </section>

      {/* ─── GUITAR SHOWCASE ─── */}
      <section>
        <PixelSectionHeader>Guitar Builds</PixelSectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guitars.map((guitar) => (
            <PixelCard key={guitar.name} variant="raised">
              {/* Image placeholder */}
              <div className="aspect-[4/3] pixel-panel-inset flex items-center justify-center mb-4 -mx-5 -mt-5">
                <div className="flex flex-col items-center gap-2 opacity-12">
                  <span className="text-2xl">&#127928;</span>
                  <span className="font-pixel text-[7px] tracking-wider">PHOTO SOON</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="font-pixel text-[10px] text-white/85 tracking-wider">
                  {guitar.name.toUpperCase()}
                </h3>
                <span className="font-pixel text-[7px] text-shelley-amber/60 pixel-panel-inset px-2 py-0.5">
                  {guitar.status.toUpperCase()}
                </span>
              </div>
              <p className="font-pixel text-[7px] text-white/25 mb-3 tracking-wider">
                {guitar.woods} &middot; {guitar.year}
              </p>
              <p className="text-white/45 text-sm leading-relaxed">
                {guitar.description}
              </p>
            </PixelCard>
          ))}
        </div>

        {/* Commission CTA */}
        <div className="mt-8 text-center">
          <a href="/contact" className="pixel-btn">
            COMMISSION A CUSTOM BUILD &rarr;
          </a>
        </div>
      </section>
    </div>
  );
}
