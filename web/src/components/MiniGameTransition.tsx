"use client";

import React, { useEffect } from "react";
import GodotEmbed from "./GodotEmbed";
import { useTransition } from "./TransitionContext";
import type { GodotEvent } from "@/lib/godot-messages";
import { emitGameEvent } from "@/lib/game-events";

const MiniGameTransition: React.FC = () => {
  const { isActive, activeGame, skip, complete } = useTransition();

  const handleGodotEvent = (event: GodotEvent) => {
    emitGameEvent(event);
    if (event.type === "minigame_complete") {
      complete();
    }
  };

  useEffect(() => {
    if (!isActive) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, skip]);

  if (!isActive || !activeGame) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl px-4">
        <GodotEmbed gameName={activeGame.gameName} onEvent={handleGodotEvent} />
        <div className="mt-4 flex justify-between items-center text-white">
          <p className="font-mono text-sm text-white/60">{activeGame.label}</p>
          <button
            onClick={skip}
            className="px-4 py-2 bg-shelley-amber text-shelley-charcoal font-bold rounded hover:bg-yellow-400 transition-colors"
          >
            Skip (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniGameTransition;
