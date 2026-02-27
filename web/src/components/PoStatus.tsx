"use client";

import React, { useState } from "react";
import { useGameEvents } from "@/hooks/useGameEvents";

interface PoState {
  mood: string;
  score: number;
  action: string;
  isNarrating: boolean;
}

const PoStatus: React.FC = () => {
  const [poState, setPoState] = useState<PoState>({
    mood: "Idle",
    score: 0,
    action: "Resting",
    isNarrating: false,
  });

  useGameEvents((event) => {
    switch (event.type) {
      case "player_state":
        setPoState((prev) => ({
          ...prev,
          mood: event.data.mood,
          score: event.data.score,
          action: event.data.action,
        }));
        break;
      case "narrative_start":
        setPoState((prev) => ({ ...prev, isNarrating: true, action: "Talking" }));
        break;
      case "narrative_end":
        setPoState((prev) => ({ ...prev, isNarrating: false }));
        break;
      case "game_ready":
        setPoState((prev) => ({ ...prev, action: "Playing" }));
        break;
      case "onboarding_complete":
        setPoState((prev) => ({ ...prev, mood: "Proud", action: "Onboarded!" }));
        break;
      default:
        break;
    }
  });

  return (
    <div className="pixel-panel px-2.5 py-1.5 flex items-center gap-2.5">
      {/* Po idle sprite */}
      <div
        className="sprite-anim animate-sprite-idle w-6 h-6 sm:w-8 sm:h-8 shrink-0"
        style={{
          backgroundImage: 'url(/sprites/po/idle_sheet.png)',
          backgroundSize: '96px 24px',
        }}
      />
      {/* Status */}
      <div className="flex flex-col gap-0">
        <div className="flex items-center gap-1.5">
          <span className="font-pixel text-[7px] text-shelley-amber crt-glow">PO</span>
          {poState.isNarrating && (
            <span className="font-pixel text-[7px] text-shelley-amber animate-blink-cursor">...</span>
          )}
        </div>
        <div className="font-pixel text-[6px] text-white/30 flex items-center gap-1.5">
          <span>{poState.mood.toUpperCase()}</span>
          <span className="text-white/10">|</span>
          <span className="text-shelley-amber/50">{poState.score}</span>
        </div>
      </div>
    </div>
  );
};

export default PoStatus;
