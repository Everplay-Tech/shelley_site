"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
import type { GodotEvent } from "@/lib/godot-messages";

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
