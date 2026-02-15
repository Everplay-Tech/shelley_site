"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
import type { GodotEvent } from "@/lib/godot-messages";

export default function Contact() {
  const pathname = usePathname();
  const gameConfig = getGameForRoute(pathname);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
  }, []);

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-4xl font-bold mb-4">Contact Us</h2>
        <p className="text-white/60 text-lg max-w-2xl">
          Interested in a custom build or have questions? Get in touch.
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

      <div className="max-w-xl bg-white/5 p-8 rounded-2xl border border-white/5">
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/60">Name</label>
            <input 
              type="text" 
              className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-shelley-amber transition-colors" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/60">Email</label>
            <input 
              type="email" 
              className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-shelley-amber transition-colors" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/60">Message</label>
            <textarea 
              rows={5} 
              className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-shelley-amber transition-colors"
            ></textarea>
          </div>
          <button 
            type="submit" 
            className="mt-4 bg-shelley-amber text-shelley-charcoal font-bold py-4 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
