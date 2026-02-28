"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import PixelSectionHeader from "@/components/PixelSectionHeader";
import PixelCard from "@/components/PixelCard";
import ZoneHeader from "@/components/ZoneHeader";
import AmbientParticles from "@/components/AmbientParticles";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
import { ZONES } from "@/lib/zone-config";
import type { GodotEvent } from "@/lib/godot-messages";

/* ─── Creative Universe data ─────────────────────────────────────────────── */

const creativeArms = [
  {
    title: "Xeno Myth",
    tag: "UNIVERSE",
    description:
      "The expanding narrative universe. Po — skeleton ghost with a hoodie and memory problems. Captain Magus — the architect. Characters born from Indonesian mythology, Deadpool energy, and late-night studio sessions.",
    color: "text-purple-400",
    borderColor: "border-purple-400/20",
  },
  {
    title: "Shelley Guitar Alchemy",
    tag: "COMIC",
    description:
      "The daily comic. Po and Captain Magus navigate the intersection of craft, chaos, and the supernatural. Part luthier journal, part interdimensional travelogue.",
    color: "text-shelley-amber",
    borderColor: "border-shelley-amber/20",
  },
  {
    title: "The Label",
    tag: "MUSIC",
    description:
      "False Friday. DJ Dooku. Weekend Wizards. Smoke Hounds. Original music from the Shelley ecosystem — genre-fluid, production-heavy, always evolving.",
    color: "text-emerald-400",
    borderColor: "border-emerald-400/20",
  },
  {
    title: "Video & Beyond",
    tag: "YOUTUBE",
    description:
      "Build logs, process breakdowns, music videos, and whatever else demands to be filmed. The visual arm of the creative output. Coming soon.",
    color: "text-red-400",
    borderColor: "border-red-400/20",
  },
];

const philosophyPoints = [
  {
    heading: "Every Guitar Starts with a Conversation",
    body: "We don't build from a catalog. Every Shelley guitar begins with the player — their hands, their sound, their story.",
  },
  {
    heading: "Old Techniques, New Understanding",
    body: "Centuries-old lutherie meets modern acoustics. We respect the traditions that work and question the ones that don't.",
  },
  {
    heading: "Craft as Technology",
    body: "A guitar is a machine for turning vibration into emotion. We treat the build process with the same rigor as engineering — because it is.",
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
    <div className="relative flex flex-col gap-16">
      <AmbientParticles type="sparkles" count={12} />

      {/* ─── ZONE HEADER ─── */}
      <ZoneHeader zone={ZONES.librarynth} />

      {/* ─── LIBRARYNTH QUEST ─── */}
      {gameConfig && (
        <section className="pixel-panel p-5 sm:p-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-pixel text-[10px] text-blue-300 crt-glow-blue tracking-wider">LIBRARYNTH QUEST</h3>
              <p className="text-white/40 text-xs mt-1">
                Guide the Scholar through the magical library maze &mdash; collect scrolls, find keys, unlock doors
              </p>
            </div>
            <span className="font-pixel text-[7px] text-white/20 hidden sm:block">
              ARROWS OR D-PAD
            </span>
          </div>
          <GodotEmbed gameName={gameConfig.gameName} onEvent={handleGodotEvent} />
        </section>
      )}

      {/* ─── PHILOSOPHY ─── */}
      <section>
        <PixelSectionHeader color="blue">The Philosophy</PixelSectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {philosophyPoints.map((point) => (
            <PixelCard key={point.heading}>
              <h3 className="font-pixel text-[8px] text-white/75 mb-3 tracking-wider leading-relaxed">
                {point.heading.toUpperCase()}
              </h3>
              <p className="text-white/45 leading-relaxed text-sm">
                {point.body}
              </p>
            </PixelCard>
          ))}
        </div>
      </section>

      {/* ─── CREATIVE UNIVERSE ─── */}
      <section>
        <PixelSectionHeader color="blue">The Creative Universe</PixelSectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {creativeArms.map((arm) => (
            <PixelCard key={arm.title} className={`${arm.borderColor}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`font-pixel text-[7px] ${arm.color} pixel-panel-inset px-2 py-0.5 tracking-wider`}>
                  {arm.tag}
                </span>
              </div>
              <h3 className={`font-pixel text-[10px] mb-2 ${arm.color} tracking-wider`}>
                {arm.title.toUpperCase()}
              </h3>
              <p className="text-white/45 leading-relaxed text-sm">
                {arm.description}
              </p>
            </PixelCard>
          ))}
        </div>
      </section>

      {/* ─── MEET THE CAST ─── */}
      <section>
        <PixelSectionHeader color="blue">Meet the Cast</PixelSectionHeader>

        <PixelCard variant="raised" hover={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                {/* Po idle sprite */}
                <div
                  className="sprite-anim animate-sprite-idle w-8 h-8 shrink-0"
                  style={{
                    backgroundImage: "url(/sprites/po/idle_sheet.png)",
                    backgroundSize: "96px 24px",
                  }}
                />
                <h3 className="font-pixel text-xs text-shelley-amber crt-glow tracking-wider">PO</h3>
              </div>
              <p className="font-pixel text-[7px] text-white/25 mb-4 tracking-wider">
                SKELETON GHOST &middot; TOUR GUIDE &middot; UNRELIABLE NARRATOR
              </p>
              <p className="text-white/50 leading-relaxed text-sm">
                A curious skeleton ghost in a fur-trimmed hoodie who doesn&apos;t
                quite remember how he got here. Based on Indonesian Po mythology —
                part spirit, part trickster, all personality. His body is
                morphable (think Green Lantern flexibility with Deadpool energy).
                He guides visitors through the Shelley world, breaks the fourth
                wall constantly, and has strong opinions about food.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                {/* Magus glyph */}
                <span className="text-shelley-amber text-lg">&#9733;</span>
                <h3 className="font-pixel text-xs text-shelley-amber crt-glow tracking-wider">
                  CAPTAIN MAGUS
                </h3>
              </div>
              <p className="font-pixel text-[7px] text-white/25 mb-4 tracking-wider">
                THE ARCHITECT &middot; XZA &middot; BUILDER OF WORLDS
              </p>
              <p className="text-white/50 leading-relaxed text-sm">
                The creator behind Shelley Guitar, the Xeno Myth universe, and
                the creative engine that ties it all together. Part luthier, part
                musician, part mad scientist. Where Po brings chaos, Magus brings
                intention — though the line between the two is thinner than you&apos;d
                think.
              </p>
            </div>
          </div>
        </PixelCard>
      </section>

      {/* ─── WRITINGS & RESOURCES ─── */}
      <section>
        <PixelSectionHeader color="blue">Writings &amp; Resources</PixelSectionHeader>

        <PixelCard variant="inset" hover={false} className="text-center py-8">
          <p className="font-pixel text-[8px] text-shelley-spirit-blue/50 mb-2 tracking-wider crt-glow-blue">
            CODEX INCOMING
          </p>
          <p className="text-white/25 text-xs max-w-md mx-auto leading-relaxed">
            The stacks are being assembled. Ancient scrolls. Build journals.
            Guitar science. The Crystal Archive remembers everything.
          </p>
        </PixelCard>
      </section>
    </div>
  );
}
