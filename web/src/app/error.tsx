"use client";

import Link from "next/link";
import AmbientParticles from "@/components/AmbientParticles";
import PoAside from "@/components/PoAside";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center py-16">
      <AmbientParticles type="sawdust" count={8} />

      <div className="relative z-10 text-center max-w-lg mx-auto px-4">
        {/* Error Title */}
        <p className="font-pixel text-[6px] tracking-[0.5em] uppercase text-shelley-amber/40 mb-4">
          SYSTEM ERROR
        </p>
        <h1 className="font-pixel text-xl sm:text-2xl text-white crt-glow mb-3">
          SOMETHING GLITCHED
        </h1>
        <p className="font-pixel text-[8px] text-white/30 mb-10">
          The signal scrambled. Try again or head back to safety.
        </p>

        {/* Po */}
        <div className="flex justify-center mb-10">
          <PoAside
            quote="That wasn't supposed to happen. Blame the gremlins."
            variant="compact"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={reset} className="pixel-btn">
            <span className="font-pixel text-[8px]">TRY AGAIN</span>
          </button>
          <Link href="/" className="pixel-btn-ghost px-4 py-2.5 inline-block">
            <span className="font-pixel text-[8px] text-shelley-amber">
              RETURN HOME
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
