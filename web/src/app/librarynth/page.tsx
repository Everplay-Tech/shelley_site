"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
import type { GodotEvent } from "@/lib/godot-messages";

/* ─── Creative Universe data ─────────────────────────────────────────────── */

const creativeArms = [
  {
    title: "Xeno Myth",
    tag: "UNIVERSE",
    description:
      "The expanding narrative universe. Po — skeleton ghost with a hoodie and memory problems. Captain Magus — the architect. CZA — coming soon. Characters born from Indonesian mythology, Deadpool energy, and late-night studio sessions.",
    color: "text-purple-400",
    borderColor: "border-purple-400/20",
    bgColor: "bg-purple-400/5",
  },
  {
    title: "Shelley Guitar Alchemy",
    tag: "COMIC",
    description:
      "The daily comic. Po and Captain Magus navigate the intersection of craft, chaos, and the supernatural. Part luthier journal, part interdimensional travelogue. Updates whenever the muse strikes.",
    color: "text-shelley-amber",
    borderColor: "border-shelley-amber/20",
    bgColor: "bg-shelley-amber/5",
  },
  {
    title: "The Label",
    tag: "MUSIC",
    description:
      "False Friday. DJ Dooku. Weekend Wizards. Smoke Hounds. Original music from the Shelley ecosystem — genre-fluid, production-heavy, always evolving. The workshop builds guitars; the label builds everything else.",
    color: "text-emerald-400",
    borderColor: "border-emerald-400/20",
    bgColor: "bg-emerald-400/5",
  },
  {
    title: "Video & Beyond",
    tag: "YOUTUBE",
    description:
      "Build logs, process breakdowns, music videos, and whatever else demands to be filmed. The visual arm of the creative output. Coming soon to a screen near you.",
    color: "text-red-400",
    borderColor: "border-red-400/20",
    bgColor: "bg-red-400/5",
  },
];

const philosophyPoints = [
  {
    heading: "Every Guitar Starts with a Conversation",
    body: "We don't build from a catalog. Every Shelley guitar begins with the player — their hands, their sound, their story. The instrument should be as unique as the musician.",
  },
  {
    heading: "Old Techniques, New Understanding",
    body: "Centuries-old lutherie meets modern acoustics. We respect the traditions that work and question the ones that don't. Wood science, not wood superstition.",
  },
  {
    heading: "Craft as Technology",
    body: "A guitar is a machine for turning vibration into emotion. We treat the build process with the same rigor as engineering — because it is. Every joint, every brace, every finish has a reason.",
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function Librarynth() {
  const pathname = usePathname();
  const gameConfig = getGameForRoute(pathname);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
  }, []);

  return (
    <div className="flex flex-col gap-16">
      {/* ─── HERO ─── */}
      <section className="text-center py-12">
        <p className="text-xs font-mono text-white/30 tracking-[0.3em] uppercase mb-4">
          library + labyrinth
        </p>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">
          The <span className="text-shelley-amber">Librarynth</span>
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
          Study space meets creative labyrinth. Guitars, comics, music,
          philosophy — everything Shelley, all in one place.
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
          <GodotEmbed
            gameName={gameConfig.gameName}
            onEvent={handleGodotEvent}
            className="max-h-[300px]"
          />
        </section>
      )}

      {/* ─── PHILOSOPHY ─── */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-xs font-mono text-white/40 tracking-[0.3em] uppercase">
            The Philosophy
          </h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {philosophyPoints.map((point) => (
            <div
              key={point.heading}
              className="bg-white/5 rounded-2xl border border-white/5 p-6 hover:border-shelley-amber/20 transition-colors"
            >
              <h3 className="text-lg font-bold mb-3 text-white/90">
                {point.heading}
              </h3>
              <p className="text-white/55 leading-relaxed text-sm">
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CREATIVE UNIVERSE ─── */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-xs font-mono text-white/40 tracking-[0.3em] uppercase">
            The Creative Universe
          </h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {creativeArms.map((arm) => (
            <div
              key={arm.title}
              className={`${arm.bgColor} rounded-2xl border ${arm.borderColor} p-6 hover:border-opacity-50 transition-all`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`text-[10px] font-mono ${arm.color} bg-white/5 px-2 py-0.5 rounded tracking-wider`}
                >
                  {arm.tag}
                </span>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${arm.color}`}>
                {arm.title}
              </h3>
              <p className="text-white/55 leading-relaxed text-sm">
                {arm.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── MEET PO ─── */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-xs font-mono text-white/40 tracking-[0.3em] uppercase">
            Meet the Cast
          </h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/5 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-1 text-shelley-amber">Po</h3>
              <p className="text-xs font-mono text-white/30 mb-4">
                SKELETON GHOST &middot; TOUR GUIDE &middot; UNRELIABLE NARRATOR
              </p>
              <p className="text-white/60 leading-relaxed">
                A curious skeleton ghost in a fur-trimmed hoodie who doesn&apos;t
                quite remember how he got here. Based on Indonesian Po mythology —
                part spirit, part trickster, all personality. His body is
                morphable (think Green Lantern flexibility with Deadpool energy).
                He guides visitors through the Shelley world, breaks the fourth
                wall constantly, and has strong opinions about food.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1 text-shelley-amber">
                Captain Magus
              </h3>
              <p className="text-xs font-mono text-white/30 mb-4">
                THE ARCHITECT &middot; XZA &middot; BUILDER OF WORLDS
              </p>
              <p className="text-white/60 leading-relaxed">
                The creator behind Shelley Guitar, the Xeno Myth universe, and
                the creative engine that ties it all together. Part luthier, part
                musician, part mad scientist. Where Po brings chaos, Magus brings
                intention — though the line between the two is thinner than you&apos;d
                think.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WRITINGS & RESOURCES ─── */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-xs font-mono text-white/40 tracking-[0.3em] uppercase">
            Writings &amp; Resources
          </h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="bg-white/[0.03] rounded-2xl border border-dashed border-white/10 p-8 text-center">
          <p className="text-white/30 font-mono text-sm mb-2">
            Coming soon
          </p>
          <p className="text-white/20 text-xs max-w-md mx-auto">
            Philosophy essays, build journals, guitar science deep-dives, comic
            archives, and whatever else demands to be written. The stacks are
            being assembled.
          </p>
        </div>
      </section>
    </div>
  );
}
