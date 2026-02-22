"use client";

import { useState, useEffect, useCallback } from "react";
import GodotEmbed from "@/components/GodotEmbed";
import { getLandingGame, ONBOARDING_COOKIE } from "@/lib/game-routes";
import { hasCookie, setCookie } from "@/lib/cookies";
import type { GodotEvent } from "@/lib/godot-messages";
import { emitGameEvent } from "@/lib/game-events";

export default function Home() {
  const [gameComplete, setGameComplete] = useState(false);
  const [showGame, setShowGame] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [gameConfig, setGameConfig] = useState(() => getLandingGame(false));

  useEffect(() => {
    const returning = hasCookie(ONBOARDING_COOKIE);
    setGameConfig(getLandingGame(returning));
    // Returning visitors skip the full-screen game
    if (returning) {
      setShowGame(false);
      setGameComplete(true);
    }
  }, []);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
    switch (event.type) {
      case "onboarding_complete":
        setCookie(ONBOARDING_COOKIE, "1");
        setGameComplete(true);
        // Brief pause to let Po's final line land, then fade
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => setShowGame(false), 800);
        }, 2000);
        break;
      default:
        break;
    }
  }, []);

  const handleSkip = useCallback(() => {
    setCookie(ONBOARDING_COOKIE, "1");
    setGameComplete(true);
    setFadeOut(true);
    setTimeout(() => setShowGame(false), 600);
  }, []);

  return (
    <>
      {/* Full-screen game overlay — covers everything including nav */}
      {showGame && (
        <div
          className={`fixed inset-0 z-[100] bg-black transition-opacity duration-700 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Game fills the entire viewport */}
          <div className="absolute inset-0">
            <GodotEmbed
              gameName={gameConfig.gameName}
              onEvent={handleGodotEvent}
              fullScreen
            />
          </div>

          {/* Skip button — small, unobtrusive, bottom-right */}
          {!gameComplete && (
            <button
              onClick={handleSkip}
              className="absolute bottom-4 right-4 z-[101] px-3 py-1.5 text-xs font-mono text-white/30 hover:text-white/70 bg-black/30 hover:bg-black/50 rounded backdrop-blur-sm transition-all"
            >
              Skip Intro
            </button>
          )}
        </div>
      )}

      {/* Site content — revealed after game completes or is skipped */}
      <div className="flex flex-col gap-12">
        <section className="text-center py-20">
          <h2 className="text-6xl font-black mb-6 tracking-tight">
            CRAFTING <span className="text-shelley-amber">SOUND</span>, <br />
            BUILDING <span className="text-shelley-amber">LEGENDS</span>.
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Handcrafted guitars built with intention. Explore the workshop.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
            <h4 className="text-lg font-bold mb-4 uppercase">The Workshop</h4>
            <p className="text-white/60 mb-6">Take a look inside the shop where every Shelley guitar is born.</p>
            <a href="/workshop" className="text-shelley-amber font-medium hover:underline">Go to Workshop &rarr;</a>
          </div>
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
            <h4 className="text-lg font-bold mb-4 uppercase">The Gallery</h4>
            <p className="text-white/60 mb-6">Browse our completed works and custom orders.</p>
            <a href="/gallery" className="text-shelley-amber font-medium hover:underline">View Gallery &rarr;</a>
          </div>
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
            <h4 className="text-lg font-bold mb-4 uppercase">About Us</h4>
            <p className="text-white/60 mb-6">Learn about the philosophy and hands behind the brand.</p>
            <a href="/about" className="text-shelley-amber font-medium hover:underline">Learn More &rarr;</a>
          </div>
        </div>
      </div>
    </>
  );
}
