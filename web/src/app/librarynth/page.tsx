"use client";

import PixelCard from "@/components/PixelCard";
import AmbientParticles from "@/components/AmbientParticles";
import { ZONES } from "@/lib/zone-config";
import { useSetZoneSidebar } from "@/components/ZoneSidebarContext";

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function Librarynth() {
  useSetZoneSidebar(ZONES.librarynth);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <AmbientParticles type="sparkles" count={16} />

      {/* ─── TEASER ─── */}
      <PixelCard variant="inset" hover={false} className="text-center py-16 px-8 max-w-2xl w-full">
        <p className="font-pixel text-[7px] text-shelley-spirit-blue/30 tracking-[0.3em] mb-6">
          DEEP BELOW THE WORKSHOP
        </p>

        <h2 className="font-pixel text-lg sm:text-xl text-shelley-spirit-blue/70 crt-glow-blue tracking-wider mb-6 leading-relaxed">
          THE LIBRARYNTH
        </h2>

        <p className="text-white/30 text-sm max-w-md mx-auto leading-relaxed mb-8">
          A labyrinth of rooms. Books on every wall. Posters from places that
          don&apos;t exist yet. Po wanders the corridors, pulling things off
          shelves, forgetting why he came in.
        </p>

        <p className="text-white/20 text-xs max-w-sm mx-auto leading-relaxed mb-10">
          Guitar science. Build journals. The Xeno Myth archives. The Crystal
          Archive remembers everything — even the things you haven&apos;t done yet.
        </p>

        <div className="flex flex-col items-center gap-3">
          <p className="font-pixel text-[8px] text-shelley-spirit-blue/40 tracking-wider crt-glow-blue animate-pulse">
            THE STACKS ARE BEING ASSEMBLED
          </p>
          <p className="font-pixel text-[6px] text-white/15 tracking-wider">
            EXPLORABLE SOON
          </p>
        </div>
      </PixelCard>
    </div>
  );
}
