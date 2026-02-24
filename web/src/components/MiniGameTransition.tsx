"use client";

import React, { useEffect, useCallback } from "react";
import GodotEmbed from "./GodotEmbed";
import { useTransition } from "./TransitionContext";
import { reportGameEvent } from "@/lib/player-state";
import type { GodotEvent } from "@/lib/godot-messages";
import { emitGameEvent } from "@/lib/game-events";

const MiniGameTransition: React.FC = () => {
  const { isActive, activeGame, skip, complete } = useTransition();

  const handleGodotEvent = useCallback(
    (event: GodotEvent) => {
      emitGameEvent(event);
      if (event.type === "minigame_complete") {
        const data = "data" in event ? event.data : { score: 0, skipped: false };
        const gameName = activeGame?.gameName ?? "unknown";

        if (data.skipped) {
          reportGameEvent({ type: "skipped", gameName });
        } else {
          reportGameEvent({
            type: "completed",
            gameName,
            score: data.score,
          });
        }
        complete();
      }
    },
    [activeGame, complete]
  );

  const handleSkip = useCallback(() => {
    if (activeGame) {
      reportGameEvent({ type: "skipped", gameName: activeGame.gameName });
    }
    skip();
  }, [activeGame, skip]);

  useEffect(() => {
    if (!isActive) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleSkip();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, handleSkip]);

  if (!isActive || !activeGame) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl px-4">
        <GodotEmbed gameName={activeGame.gameName} onEvent={handleGodotEvent} />
        <div className="mt-4 flex justify-between items-center text-white">
          <p className="font-mono text-sm text-white/60">{activeGame.label}</p>
          <button
            onClick={handleSkip}
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
