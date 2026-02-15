"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
import type { GodotEvent } from "@/lib/godot-messages";

export default function Gallery() {
  const pathname = usePathname();
  const gameConfig = getGameForRoute(pathname);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
  }, []);

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-4xl font-bold mb-4">The Gallery</h2>
        <p className="text-white/60 text-lg max-w-2xl">
          A collection of our finest handcrafted instruments. Each one a unique masterpiece.
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
          <GodotEmbed gameName={gameConfig.gameName} onEvent={handleGodotEvent} />
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="group flex flex-col gap-4 bg-white/5 rounded-2xl border border-white/5 p-4 hover:border-shelley-amber/30 transition-colors cursor-pointer"
          >
            <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
              <span className="text-white/10 group-hover:text-white/20 transition-colors uppercase font-bold tracking-widest text-xs">
                Image Placeholder
              </span>
            </div>
            <div className="px-2 pb-2">
              <h4 className="font-bold text-white/90">Custom Build #{i}</h4>
              <p className="text-white/40 text-xs font-mono mt-1">
                Mahogany / Spruce / 2024
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
