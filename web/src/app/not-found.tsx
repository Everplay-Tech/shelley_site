"use client";

import { useMemo } from "react";
import Link from "next/link";
import AmbientParticles from "@/components/AmbientParticles";
import PoAside from "@/components/PoAside";

const LOST_QUOTES = [
  "This doesn't look like any zone I've visited... and my memory's already bad enough.",
  "I think we took a wrong turn at the spirit realm. Again.",
  "404... is that a zone? Sounds haunted. More haunted than me.",
  "Even ghosts can get lost, apparently.",
];

const ZONES = [
  { href: "/workshop", label: "THE WORKSHOP", color: "text-shelley-amber" },
  { href: "/gallery", label: "THE GALLERY", color: "text-shelley-djinn-purple" },
  { href: "/librarynth", label: "THE LIBRARYNTH", color: "text-shelley-spirit-blue" },
  { href: "/contact", label: "GET IN TOUCH", color: "text-shelley-spirit-green" },
];

export default function NotFound() {
  const quote = useMemo(() => {
    const idx = Math.floor(Math.random() * LOST_QUOTES.length);
    return LOST_QUOTES[idx];
  }, []);

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center py-16">
      <AmbientParticles type="sparkles" count={12} />

      <div className="relative z-10 text-center max-w-lg mx-auto px-4">
        {/* 404 Title */}
        <p className="font-pixel text-[6px] tracking-[0.5em] uppercase text-shelley-djinn-purple/40 mb-4">
          SIGNAL LOST
        </p>
        <h1 className="font-pixel text-4xl sm:text-5xl text-white crt-glow-purple mb-3">
          404
        </h1>
        <p className="font-pixel text-[8px] text-white/30 mb-10">
          This zone doesn&apos;t exist. Or maybe it does, and we just can&apos;t see it.
        </p>

        {/* Po */}
        <div className="flex justify-center mb-10">
          <PoAside quote={quote} variant="compact" />
        </div>

        {/* Return Home */}
        <Link href="/" className="pixel-btn inline-block mb-10">
          <span className="font-pixel text-[8px]">RETURN HOME</span>
        </Link>

        {/* Zone Grid */}
        <div className="pixel-divider mb-8" />
        <p className="font-pixel text-[6px] text-white/20 tracking-widest uppercase mb-4">
          Or warp to a zone
        </p>
        <div className="grid grid-cols-2 gap-3">
          {ZONES.map((zone) => (
            <Link
              key={zone.href}
              href={zone.href}
              className="pixel-btn-ghost px-3 py-2.5 text-center"
            >
              <span className={`font-pixel text-[6px] ${zone.color}`}>
                {zone.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
