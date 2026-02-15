"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
import type { GodotEvent } from "@/lib/godot-messages";

export default function Workshop() {
  const pathname = usePathname();
  const gameConfig = getGameForRoute(pathname);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
  }, []);

  const steps = [
    {
      id: "01",
      title: "Wood Selection",
      description: "Choosing the right tonewood is where every guitar begins.",
    },
    {
      id: "02",
      title: "Shaping",
      description: "Hand-carved to precise dimensions, every curve matters.",
    },
    {
      id: "03",
      title: "Finishing",
      description: "Lacquer, oil, or natural — the finish protects and resonates.",
    },
    {
      id: "04",
      title: "Setup",
      description: "Action, intonation, and playability. The final touch.",
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-4xl font-bold mb-4">The Workshop</h2>
        <p className="text-white/60 text-lg max-w-2xl">
          Where wood meets steel and passion becomes music. Experience the process of building a Shelley guitar.
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

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className="bg-white/5 rounded-2xl border border-white/5 p-6 flex flex-col gap-4"
            >
              <span className="text-2xl font-black text-shelley-amber font-mono">
                {step.id}
              </span>
              <h4 className="text-lg font-bold uppercase tracking-wide">
                {step.title}
              </h4>
              <p className="text-white/60 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
