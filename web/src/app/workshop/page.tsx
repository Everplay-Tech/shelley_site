"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import PixelSectionHeader from "@/components/PixelSectionHeader";
import PixelCard from "@/components/PixelCard";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
import type { GodotEvent } from "@/lib/godot-messages";

/* ─── Current builds ─────────────────────────────────────────────────────── */

const currentBuilds = [
  {
    name: "The Djinn",
    stage: "Bracing & Voicing",
    progress: 65,
    woods: "Wenge body, Sitka Spruce top",
    note: "Dark-toned parlor guitar inspired by the Djinn World. Scalloped X-bracing, voiced for supernatural resonance.",
  },
  {
    name: "Smoke Ring",
    stage: "Design Phase",
    progress: 15,
    woods: "Mahogany body, Cedar top",
    note: "Warm, smoky midrange. Fingerstyle-friendly action. Built for late-night sessions.",
  },
];

/* ─── Toolkit ────────────────────────────────────────────────────────────── */

const tools = [
  { name: "Hand Planes", desc: "Lie-Nielsen block & smoothing planes for top and brace shaping" },
  { name: "Chisels", desc: "Japanese bench chisels for mortise work and detailed carving" },
  { name: "Saws", desc: "Dozuki saws for fret slots, coping saw for headstock and curves" },
  { name: "Bending Iron", desc: "Heated bending iron for side and cutaway shaping" },
  { name: "Go-Bar Deck", desc: "Pressure-based gluing system for bracing and top assembly" },
  { name: "Fret Press", desc: "Arbor press with caul inserts for precise fret seating" },
];

const steps = [
  {
    id: "01",
    title: "Wood Selection",
    description:
      "Every guitar starts with the right wood. We source tonewoods based on the player's sound goals — bright and cutting, warm and round, or something in between.",
    detail:
      "We look at grain orientation, density, tap tone, and moisture content. No two blanks are identical, and that's the point.",
  },
  {
    id: "02",
    title: "Shaping",
    description:
      "Hand-carved to precise dimensions. The body profile, neck shape, and bracing pattern all influence how the guitar feels and sounds.",
    detail:
      "Neck profiles range from slim C-shapes for speed players to chunky D-shapes for grip. Bracing is scalloped and voiced by ear.",
  },
  {
    id: "03",
    title: "Finishing",
    description:
      "The finish isn't just cosmetic — it protects the wood and affects resonance. Thin lacquer lets the top breathe. Oil finishes feel natural.",
    detail:
      "We avoid thick polyester finishes that choke vibration. Every coat is hand-applied and sanded between layers.",
  },
  {
    id: "04",
    title: "Setup & Voicing",
    description:
      "Action height, intonation, nut slots, saddle compensation, truss rod relief — the setup is where a guitar goes from \"built\" to \"alive.\"",
    detail:
      "Final voicing happens here too — adjusting bracing tension, saddle material, and string gauge to dial in the character.",
  },
];

export default function Workshop() {
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
          THE <span className="text-shelley-amber">WORKSHOP</span>
        </h1>
        <p className="text-sm text-white/45 max-w-xl mx-auto leading-relaxed">
          Where wood meets steel and passion becomes music. Every Shelley guitar
          is built by hand, start to finish.
        </p>
      </section>

      {/* ─── WORKSHOP CRAFT ─── */}
      {gameConfig && (
        <section className="pixel-panel p-5 sm:p-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-pixel text-[10px] text-[#c4956a] crt-glow tracking-wider">WORKSHOP CRAFT</h3>
              <p className="text-white/40 text-xs mt-1">
                Stack wood blocks Tetris-style &mdash; clear lines to prove your craftsmanship
              </p>
            </div>
            <span className="font-pixel text-[7px] text-white/20 hidden sm:block">
              ARROWS &middot; UP ROT &middot; SPACE DROP
            </span>
          </div>
          <GodotEmbed gameName={gameConfig.gameName} onEvent={handleGodotEvent} />
        </section>
      )}

      {/* ─── PROCESS STEPS ─── */}
      <section>
        <PixelSectionHeader>The Process</PixelSectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => (
            <PixelCard key={step.id}>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-pixel text-[10px] text-shelley-amber/70">
                  {step.id}
                </span>
                <h3 className="font-pixel text-[9px] uppercase tracking-wider text-white/80">
                  {step.title}
                </h3>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-2">
                {step.description}
              </p>
              <p className="text-white/25 text-xs leading-relaxed italic">
                {step.detail}
              </p>
            </PixelCard>
          ))}
        </div>
      </section>

      {/* ─── CURRENT BUILDS ─── */}
      <section>
        <PixelSectionHeader>Current Builds</PixelSectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentBuilds.map((build) => (
            <PixelCard key={build.name} variant="raised">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-pixel text-[10px] text-shelley-amber tracking-wider">
                  {build.name.toUpperCase()}
                </h3>
                <span className="font-pixel text-[7px] text-white/30 pixel-panel-inset px-2 py-1">
                  {build.stage.toUpperCase()}
                </span>
              </div>
              <p className="font-pixel text-[7px] text-white/25 mb-3 tracking-wider">
                {build.woods}
              </p>
              <p className="text-white/45 text-sm leading-relaxed mb-4">
                {build.note}
              </p>
              {/* Pixel progress bar */}
              <div className="pixel-progress-track">
                <div
                  className="pixel-progress-fill"
                  style={{ width: `${build.progress}%` }}
                />
              </div>
              <p className="font-pixel text-[7px] text-white/20 mt-1.5 text-right">
                {build.progress}%
              </p>
            </PixelCard>
          ))}
        </div>
      </section>

      {/* ─── TOOLKIT ─── */}
      <section>
        <PixelSectionHeader>The Toolkit</PixelSectionHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <PixelCard key={tool.name} variant="inset" hover={false} className="p-4">
              <h4 className="font-pixel text-[8px] text-white/70 mb-1.5 tracking-wider">
                {tool.name.toUpperCase()}
              </h4>
              <p className="text-white/30 text-xs leading-relaxed">{tool.desc}</p>
            </PixelCard>
          ))}
        </div>
      </section>

      {/* ─── PHILOSOPHY CALLOUT ─── */}
      <PixelCard variant="inset" hover={false} className="text-center py-8">
        <p className="text-white/35 text-sm max-w-lg mx-auto leading-relaxed mb-4">
          &ldquo;A guitar is a machine for turning vibration into emotion. We
          treat every build with that weight.&rdquo;
        </p>
        <a href="/librarynth" className="pixel-btn-ghost">
          READ MORE IN THE LIBRARYNTH &rarr;
        </a>
      </PixelCard>
    </div>
  );
}
