"use client";

import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import GodotEmbed from "@/components/GodotEmbed";
import { getLandingGame, ONBOARDING_COOKIE } from "@/lib/game-routes";
import { hasCookie, setCookie } from "@/lib/cookies";
import type { GodotEvent } from "@/lib/godot-messages";
import { emitGameEvent } from "@/lib/game-events";

export default function Home() {
  const [isReturning, setIsReturning] = useState(false);
  const [isNarrativePlaying, setIsNarrativePlaying] = useState(false);
  
  // Initialize with first visit config for SSR consistency
  const [gameConfig, setGameConfig] = useState(() => getLandingGame(false));

  useEffect(() => {
    const returning = hasCookie(ONBOARDING_COOKIE);
    setIsReturning(returning);
    setGameConfig(getLandingGame(returning));
  }, []);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
    switch (event.type) {
      case "onboarding_complete":
        setCookie(ONBOARDING_COOKIE, "1");
        // We don't immediately swap the game to avoid jarring the user,
        // they'll see the returning game on next refresh/visit.
        break;
      case "narrative_start":
        setIsNarrativePlaying(true);
        break;
      case "narrative_end":
        setIsNarrativePlaying(false);
        break;
      default:
        break;
    }
  }, []);

  return (
    <div className="flex flex-col gap-12">
      <section className="text-center py-20">
        <h2 className="text-6xl font-black mb-6 tracking-tight">
          CRAFTING <span className="text-shelley-amber">SOUND</span>, <br />
          BUILDING <span className="text-shelley-amber">LEGENDS</span>.
        </h2>
        <p className="text-xl text-white/60 max-w-2xl mx-auto">
          {isReturning 
            ? "Welcome back. Po's ready to ride."
            : "Welcome to the Shelley Workshop. Po wants to show you around."}
        </p>
      </section>

      <section className="bg-white/5 rounded-3xl p-8 border border-white/10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl font-bold">{gameConfig.label}</h3>
            <p className="text-white/60">
              {isReturning 
                ? "Po is ready to help you explore. Use the game to navigate the site."
                : "Join Po for a quick introduction to the workshop."}
            </p>
          </div>
          <span className="text-xs font-mono text-shelley-amber bg-shelley-amber/10 px-2 py-1 rounded">GODOT 4.3 EMBED</span>
        </div>
        <GodotEmbed 
          gameName={gameConfig.gameName} 
          onEvent={handleGodotEvent}
        />
      </section>

      <div 
        className={clsx(
          "grid grid-cols-1 md:grid-cols-3 gap-8 transition-opacity duration-500",
          isNarrativePlaying ? "opacity-30 pointer-events-none" : "opacity-100"
        )}
      >
        <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
          <h4 className="text-lg font-bold mb-4 uppercase">The Workshop</h4>
          <p className="text-white/60 mb-6">Take a look inside the shop where every Shelley guitar is born.</p>
          <a href="/workshop" className="text-shelley-amber font-medium hover:underline">Go to Workshop →</a>
        </div>
        <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
          <h4 className="text-lg font-bold mb-4 uppercase">The Gallery</h4>
          <p className="text-white/60 mb-6">Browse our completed works and custom orders.</p>
          <a href="/gallery" className="text-shelley-amber font-medium hover:underline">View Gallery →</a>
        </div>
        <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
          <h4 className="text-lg font-bold mb-4 uppercase">About Us</h4>
          <p className="text-white/60 mb-6">Learn about the philosophy and hands behind the brand.</p>
          <a href="/about" className="text-shelley-amber font-medium hover:underline">Learn More →</a>
        </div>
      </div>
    </div>
  );
}
