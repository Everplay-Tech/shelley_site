"use client";

import PixelSectionHeader from "@/components/PixelSectionHeader";
import PixelCard from "@/components/PixelCard";
import AmbientParticles from "@/components/AmbientParticles";
import { ZONES } from "@/lib/zone-config";
import { useSetZoneSidebar } from "@/components/ZoneSidebarContext";

/* ─── Current builds ─────────────────────────────────────────────────────── */

const currentBuilds: {
  name: string;
  model: string;
  stage: string;
  progress: number;
  woods: string;
  note: string;
}[] = [
  {
    name: "Purp Dagon",
    model: "Dagon",
    stage: "In Progress",
    progress: 0,
    woods: "",
    note: "",
  },
  {
    name: "Weird Barbara",
    model: "Dagon",
    stage: "In Progress",
    progress: 0,
    woods: "",
    note: "",
  },
  {
    name: "Quint",
    model: "Chimera",
    stage: "In Progress",
    progress: 0,
    woods: "",
    note: "",
  },
  {
    name: "Purp Turtle",
    model: "Turtle",
    stage: "In Progress",
    progress: 0,
    woods: "",
    note: "",
  },
  {
    name: "Starfox",
    model: "SolidGuitar",
    stage: "In Progress",
    progress: 0,
    woods: "",
    note: "",
  },
];

/* ─── Toolkit ────────────────────────────────────────────────────────────── */

const tools = [
  { name: "Hand Planes", desc: "Block and smoothing planes for top and brace shaping. No CNC — everything by hand and by ear." },
  { name: "Chisels", desc: "Vintage Japanese blade metal for mortise work and detailed carving. Old steel, new purpose." },
  { name: "Saws", desc: "Dozuki saws for fret slots, coping saw for curves. Precision cuts, bench-scale work." },
  { name: "Bending Iron", desc: "Heated bending iron for side and cutaway shaping. Heat, steam, patience." },
  { name: "Go-Bar Deck", desc: "Pressure-based gluing for bracing and top assembly. StewMac-supplied, battle-tested." },
  { name: "Fret Press", desc: "Arbor press with Benedetto-style caul inserts for precise fret seating." },
];

const taoAspects = [
  {
    id: "01",
    title: "The Conversation",
    description:
      "Every Shelley is tailor-made, but custom orders aren't the norm. We let the wood drive the process — the grain, the tap tone, the weight in our hands. The material speaks first. We listen. Then we build.",
    detail:
      "We make guitars with intent, not on demand. When a piece of wood tells us what it wants to be, that's when the build begins.",
  },
  {
    id: "02",
    title: "The Arbor",
    description:
      "Our tonewoods come from Kimball Hardwoods — a relationship built on trust. We don't rush the wood. Every blank sits in our shop for a full year before we touch it. Acclimatization isn't a step. It's a principle.",
    detail:
      "A year of settling. A year of the wood learning our humidity, our air, our space. By the time we cut, the wood already knows the shop.",
    link: { text: "KIMBALL HARDWOODS", href: "https://www.kimballhardwoods.com/" },
  },
  {
    id: "03",
    title: "The Voiced Pickup",
    description:
      "We wind every pickup by hand — unique coil patterns, unique turn counts. No two Shelleys sound the same because no two pickups are the same. We build experimental shapes, one-off designs, things that shouldn't work but do.",
    detail:
      "Partially potted. The combination of DCR and controlled microphonics gives each pickup its own DNA — an honest, actual identity. Then we glue them in. Ready for battle.",
  },
  {
    id: "04",
    title: "The Finish",
    description:
      "We default to natural, environmentally friendly finishes — green where it counts. But we don't pretend tradition has nothing to teach us. Classic nitrocellulose lacquer and marine-grade epoxy earn their place when the build demands it.",
    detail:
      "Responsible doesn't mean rigid. We choose the finish that serves the wood, the player, and the planet — in that order.",
  },
  {
    id: "05",
    title: "The Systems",
    description:
      "We're completely self-taught. No formal training, no apprenticeships. We built our own technology — systems trained on the best luthier literature to assist with mathematics, design hypotheticals, and material science.",
    detail:
      "We scrounged for every piece of knowledge we have. And we're proud of that. Everything we make is built with intent and with soul.",
  },
];

export default function Workshop() {
  useSetZoneSidebar(ZONES.workshop);

  return (
    <div className="relative flex flex-col gap-16">
      <AmbientParticles type="sawdust" count={8} />

      {/* ─── THE TAO OF ARBOR & SONOS ─── */}
      <section>
        <PixelSectionHeader>The Tao of Arbor &amp; Sonos</PixelSectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {taoAspects.map((aspect) => (
            <PixelCard key={aspect.id} className="transition-all hover:border-l-2 hover:border-shelley-amber/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-pixel text-[10px] text-shelley-amber/70">
                  {aspect.id}
                </span>
                <h3 className="font-pixel text-[9px] uppercase tracking-wider text-white/80">
                  {aspect.title}
                </h3>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-2">
                {aspect.description}
              </p>
              <p className="text-white/25 text-xs leading-relaxed italic">
                {aspect.detail}
              </p>
              {"link" in aspect && aspect.link && (
                <a
                  href={aspect.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 pixel-btn-ghost text-[8px]"
                >
                  {aspect.link.text} &rarr;
                </a>
              )}
            </PixelCard>
          ))}
        </div>
      </section>

      {/* ─── CURRENT BUILDS ─── */}
      {currentBuilds.length > 0 && (
        <section>
          <PixelSectionHeader>Current Builds</PixelSectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentBuilds.map((build) => (
              <PixelCard key={build.name} variant="raised">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-pixel text-[10px] text-shelley-amber tracking-wider">
                      {build.name.toUpperCase()}
                    </h3>
                    <p className="font-pixel text-[7px] text-white/30 tracking-wider mt-0.5">
                      {build.model}
                    </p>
                  </div>
                  <span className="font-pixel text-[7px] text-white/30 pixel-panel-inset px-2 py-1 badge-pulse">
                    {build.stage.toUpperCase()}
                  </span>
                </div>
                {build.woods && (
                  <p className="font-pixel text-[7px] text-white/25 mb-3 tracking-wider">
                    {build.woods}
                  </p>
                )}
                {build.note && (
                  <p className="text-white/45 text-sm leading-relaxed mb-4">
                    {build.note}
                  </p>
                )}
                {build.progress > 0 && (
                  <>
                    <div className="pixel-progress-track">
                      <div
                        className="pixel-progress-fill"
                        style={{ width: `${build.progress}%` }}
                      />
                    </div>
                    <p className="font-pixel text-[7px] text-white/20 mt-1.5 text-right">
                      {build.progress}%
                    </p>
                  </>
                )}
              </PixelCard>
            ))}
          </div>
        </section>
      )}

      {/* ─── TOOLKIT ─── */}
      <section>
        <PixelSectionHeader>The Toolkit</PixelSectionHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <PixelCard key={tool.name} variant="inset" hover={false} className="p-4 group">
              <h4 className="font-pixel text-[8px] text-white/70 mb-1.5 tracking-wider group-hover:text-shelley-amber/80 transition-colors">
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
          &ldquo;The vibration starts in the player, not the instrument. Electricity is the conduit.
          We build the vessel that turns potential energy into soulfire.&rdquo;
        </p>
        <a href="/account" className="pixel-btn-ghost">
          READ MORE &rarr;
        </a>
      </PixelCard>
    </div>
  );
}
