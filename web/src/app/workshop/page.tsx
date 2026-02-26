"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
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
    icon: "\uD83C\uDF33",
    description:
      "Every guitar starts with the right wood. We source tonewoods based on the player's sound goals — bright and cutting, warm and round, or something in between. Spruce, cedar, mahogany, maple, rosewood, wenge — each species has a voice.",
    detail:
      "We look at grain orientation, density, tap tone, and moisture content. No two blanks are identical, and that's the point.",
  },
  {
    id: "02",
    title: "Shaping",
    icon: "\uD83D\uDD28",
    description:
      "Hand-carved to precise dimensions. The body profile, neck shape, and bracing pattern all influence how the guitar feels and sounds. We carve for the player's hands — not a template.",
    detail:
      "Neck profiles range from slim C-shapes for speed players to chunky D-shapes for grip. Bracing is scalloped and voiced by ear.",
  },
  {
    id: "03",
    title: "Finishing",
    icon: "\u2728",
    description:
      "The finish isn't just cosmetic — it protects the wood and affects resonance. Thin lacquer lets the top breathe. Oil finishes feel natural to the touch. We match the finish to the build's personality.",
    detail:
      "We avoid thick polyester finishes that choke vibration. Every coat is hand-applied and sanded between layers.",
  },
  {
    id: "04",
    title: "Setup & Voicing",
    icon: "\uD83C\uDFB5",
    description:
      "Action height, intonation, nut slots, saddle compensation, truss rod relief — the setup is where a guitar goes from \"built\" to \"alive.\" We play-test every instrument before it leaves.",
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
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">
          The <span className="text-shelley-amber">Workshop</span>
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto">
          Where wood meets steel and passion becomes music. Every Shelley guitar
          is built by hand, start to finish.
        </p>
      </section>

      {/* ─── WORKSHOP CRAFT ─── */}
      {gameConfig && (
        <section className="bg-gradient-to-b from-shelley-wood/10 to-transparent rounded-3xl p-8 border border-shelley-wood/20">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-xl font-bold text-[#c4956a]">Workshop Craft</h3>
              <p className="text-white/50 text-sm">
                Stack wood blocks Tetris-style &mdash; clear lines to prove your craftsmanship
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-white/25 block">
                Arrows to move &middot; Up to rotate &middot; Space to drop
              </span>
            </div>
          </div>
          <GodotEmbed gameName={gameConfig.gameName} onEvent={handleGodotEvent} />
        </section>
      )}

      {/* ─── PROCESS STEPS ─── */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-xs font-mono text-white/40 tracking-[0.3em] uppercase">
            The Process
          </h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className="bg-white/5 rounded-2xl border border-white/5 p-6 hover:border-shelley-amber/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{step.icon}</span>
                <div>
                  <span className="text-xs font-mono text-shelley-amber/60">
                    STEP {step.id}
                  </span>
                  <h3 className="text-lg font-bold uppercase tracking-wide text-white/90">
                    {step.title}
                  </h3>
                </div>
              </div>

              <p className="text-white/60 text-sm leading-relaxed mb-3">
                {step.description}
              </p>

              <p className="text-white/30 text-xs leading-relaxed italic">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CURRENT BUILDS ─── */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-xs font-mono text-white/40 tracking-[0.3em] uppercase">
            Current Builds
          </h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentBuilds.map((build) => (
            <div
              key={build.name}
              className="bg-white/5 rounded-2xl border border-white/5 p-6 hover:border-shelley-amber/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-shelley-amber">
                  {build.name}
                </h3>
                <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">
                  {build.stage}
                </span>
              </div>
              <p className="text-xs font-mono text-white/30 mb-3">
                {build.woods}
              </p>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                {build.note}
              </p>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-shelley-amber/60 to-shelley-amber rounded-full transition-all"
                  style={{ width: `${build.progress}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-white/25 mt-1.5 text-right">
                {build.progress}% complete
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TOOLKIT ─── */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-xs font-mono text-white/40 tracking-[0.3em] uppercase">
            The Toolkit
          </h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="bg-white/[0.03] rounded-xl border border-white/5 p-4 hover:border-white/10 transition-colors"
            >
              <h4 className="text-sm font-bold text-white/80 mb-1">{tool.name}</h4>
              <p className="text-white/35 text-xs leading-relaxed">{tool.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PHILOSOPHY CALLOUT ─── */}
      <section className="bg-white/[0.03] rounded-2xl border border-white/5 p-8 text-center">
        <p className="text-white/40 text-sm max-w-lg mx-auto leading-relaxed mb-4">
          &ldquo;A guitar is a machine for turning vibration into emotion. We
          treat every build with that weight.&rdquo;
        </p>
        <a
          href="/librarynth"
          className="text-shelley-amber text-xs font-mono hover:underline"
        >
          Read more in the Librarynth &rarr;
        </a>
      </section>
    </div>
  );
}
