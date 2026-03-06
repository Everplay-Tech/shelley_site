"use client";

import PixelCard from "@/components/PixelCard";
import AmbientParticles from "@/components/AmbientParticles";
import { ZONES } from "@/lib/zone-config";
import { useSetZoneSidebar } from "@/components/ZoneSidebarContext";

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function Account() {
  useSetZoneSidebar(ZONES.account);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <AmbientParticles type="sparkles" count={16} />

      {/* ─── TEASER ─── */}
      <PixelCard variant="inset" hover={false} className="text-center py-16 px-8 max-w-2xl w-full">
        <p className="font-pixel text-[7px] text-shelley-spirit-blue/30 tracking-[0.3em] mb-6">
          YOUR SPACE
        </p>

        <h2 className="font-pixel text-lg sm:text-xl text-shelley-spirit-blue/70 crt-glow-blue tracking-wider mb-6 leading-relaxed">
          ACCOUNT
        </h2>

        <p className="text-white/30 text-sm max-w-md mx-auto leading-relaxed mb-8">
          Saves, orders, rewards — everything that&apos;s yours lives here.
          Po keeps an eye on things. Or tries to. Ghost memory isn&apos;t great.
        </p>

        <div className="flex flex-col items-center gap-3">
          <p className="font-pixel text-[8px] text-shelley-spirit-blue/40 tracking-wider crt-glow-blue animate-pulse">
            BEING ASSEMBLED
          </p>
          <p className="font-pixel text-[6px] text-white/15 tracking-wider">
            COMING SOON
          </p>
        </div>
      </PixelCard>
    </div>
  );
}
