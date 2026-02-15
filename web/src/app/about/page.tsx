"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
import type { GodotEvent } from "@/lib/godot-messages";

export default function About() {
  const pathname = usePathname();
  const gameConfig = getGameForRoute(pathname);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
  }, []);

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-4xl font-bold mb-4">About Shelley Guitars</h2>
        <p className="text-white/60 text-lg max-w-2xl">
          Founded on the principles of traditional lutherie and modern innovation.
        </p>
      </section>

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

      <section className="flex flex-col gap-8">
        <div className="bg-white/5 rounded-2xl border border-white/5 p-8">
          <h3 className="text-2xl font-bold mb-4 uppercase tracking-tight text-shelley-amber">
            The Philosophy
          </h3>
          <p className="text-white/70 leading-relaxed text-lg">
            Every Shelley guitar begins with a conversation. We believe instruments 
            should be as unique as the musicians who play them. Our approach 
            combines centuries-old lutherie techniques with modern understanding 
            of acoustics and playability.
          </p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/5 p-8">
          <h3 className="text-2xl font-bold mb-4 uppercase tracking-tight text-shelley-amber">
            Meet Po
          </h3>
          <p className="text-white/70 leading-relaxed text-lg">
            Po is our workshop mascot — a curious pixel-art character in a green 
            hoodie who guides visitors through the Shelley world. Part tour guide, 
            part adventurer, Po represents the playful spirit we bring to every build.
          </p>
        </div>
      </section>
    </div>
  );
}
