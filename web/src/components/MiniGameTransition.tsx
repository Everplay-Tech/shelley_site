"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import GodotEmbed, { type GodotEmbedHandle } from "./GodotEmbed";
import PoGameIntro from "./PoGameIntro";
import { useTransition } from "./TransitionContext";
import { reportGameEvent } from "@/lib/player-state";
import type { GodotEvent, OfferSavesCommand } from "@/lib/godot-messages";
import { emitGameEvent } from "@/lib/game-events";
import { getZoneForRoute } from "@/lib/zone-config";

interface SaveEntry {
  slot: number;
  label: string;
  updatedAt: string;
  saveData: Record<string, unknown>;
}

async function fetchSavesForGame(gameName: string): Promise<SaveEntry[]> {
  try {
    const res = await fetch(`/api/saves?game=${encodeURIComponent(gameName)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.saves ?? []).map((s: Record<string, unknown>) => ({
      slot: s.slot as number,
      label: (s.label ?? "") as string,
      updatedAt: (s.updatedAt ?? "") as string,
      saveData: (s.saveData ?? {}) as Record<string, unknown>,
    }));
  } catch {
    return [];
  }
}

async function postSave(
  gameName: string,
  slot: number,
  saveData: Record<string, unknown>,
  label: string
) {
  try {
    await fetch("/api/saves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: gameName, slot, saveData, label }),
    });
  } catch {
    // Save failed silently — game continues
  }
}

const MiniGameTransition: React.FC = () => {
  const { isActive, activeGame, quickTransit, pendingUrl, skip, complete, isReplay, setGamesEnabled } = useTransition();
  const [introPhase, setIntroPhase] = useState<"intro" | "game">("game");
  const godotRef = useRef<GodotEmbedHandle>(null);

  const zone = pendingUrl ? getZoneForRoute(pendingUrl) : null;

  // Reset intro phase when a new transition begins
  useEffect(() => {
    if (isActive && activeGame) {
      const showIntro = !quickTransit && !isReplay && !!zone;
      setIntroPhase(showIntro ? "intro" : "game");
    }
  }, [isActive, activeGame, quickTransit, isReplay, zone]);

  const handleIntroComplete = useCallback(() => {
    setIntroPhase("game");
  }, []);

  // Send offer_saves command to Godot with current save data
  const sendOfferSaves = useCallback(
    (saves: SaveEntry[]) => {
      const cmd: OfferSavesCommand = {
        command: "offer_saves",
        data: { saves },
      };
      godotRef.current?.sendCommand(cmd);
    },
    []
  );

  const handleGodotEvent = useCallback(
    (event: GodotEvent) => {
      emitGameEvent(event);

      const gameName = activeGame?.gameName ?? "unknown";

      if (event.type === "minigame_complete") {
        const data = "data" in event ? event.data : { score: 0, skipped: false };

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
        return;
      }

      // Game ready — offer existing saves if user is authenticated
      if (event.type === "game_ready" && activeGame) {
        fetchSavesForGame(activeGame.gameName).then((saves) => {
          if (saves.length > 0) {
            sendOfferSaves(saves);
          }
        });
        return;
      }

      // Godot wants to persist a save
      if (event.type === "save_state" && activeGame) {
        const { slot, label, saveData } = event.data;
        postSave(activeGame.gameName, slot, saveData, label);
        return;
      }

      // Godot requests current saves (e.g. after load menu opened)
      if (event.type === "request_saves" && activeGame) {
        fetchSavesForGame(activeGame.gameName).then(sendOfferSaves);
        return;
      }
    },
    [activeGame, complete, sendOfferSaves]
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

  // Auto-navigate after quick transit wipe animation
  useEffect(() => {
    if (!quickTransit || !pendingUrl) return;
    const timer = setTimeout(() => {
      skip();
    }, 350);
    return () => clearTimeout(timer);
  }, [quickTransit, pendingUrl, skip]);

  if (!isActive) return null;

  // Quick transit — wipe overlay with no game
  if (quickTransit) {
    return (
      <div className="fixed inset-0 z-50 bg-black transition-wipe-in flex items-center justify-center" aria-hidden="true">
        <div className="transition-scanline-edge" aria-hidden="true" />
        <p className="font-pixel text-[8px] text-white/30 tracking-widest">TRAVELING...</p>
      </div>
    );
  }

  if (!activeGame) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black transition-wipe-in flex flex-col items-center justify-center" role="dialog" aria-label="Game transition" aria-modal="true">
      <div className="transition-scanline-edge" aria-hidden="true" />

      {/* Po intro animation before game loads */}
      {introPhase === "intro" && zone && (
        <PoGameIntro zoneId={zone.id} onComplete={handleIntroComplete} />
      )}

      {/* Game content */}
      {introPhase === "game" && (
        <div className="w-full max-w-4xl px-4">
          <GodotEmbed ref={godotRef} gameName={activeGame.gameName} onEvent={handleGodotEvent} />
          <div className="mt-4 flex justify-between items-center">
            <p className="font-pixel text-[7px] text-white/40 tracking-wider">
              {activeGame.label?.toUpperCase() ?? "LOADING..."}
            </p>
            <div className="flex items-center gap-3">
              {!isReplay && (
                <button
                  onClick={() => {
                    setGamesEnabled(false);
                    handleSkip();
                  }}
                  className="font-pixel text-[6px] text-white/20 hover:text-white/50 transition-colors tracking-wider"
                  aria-label="Turn off transition games"
                >
                  TURN OFF GAMES
                </button>
              )}
              <button onClick={handleSkip} className="pixel-btn-ghost" aria-label={isReplay ? "Close game (Escape)" : "Skip game and continue to page (Escape)"}>
                {isReplay ? "CLOSE (ESC)" : "SKIP (ESC)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniGameTransition;
