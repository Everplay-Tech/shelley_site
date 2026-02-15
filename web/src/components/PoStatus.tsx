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
    <div className="bg-shelley-charcoal/50 backdrop-blur-sm border border-white/10 p-4 rounded-lg text-sm">
      <h3 className="text-shelley-amber font-bold mb-2 uppercase tracking-wider flex items-center gap-2">
        Po&apos;s Status
        {poState.isNarrating && (
          <span className="inline-block w-2 h-2 rounded-full bg-shelley-amber animate-pulse" />
        )}
      </h3>
      <div className="grid grid-cols-2 gap-2 text-white/80">
        <span>Mood:</span>
        <span className="text-white">{poState.mood}</span>
        <span>Score:</span>
        <span className="text-white">{poState.score}</span>
        <span>Action:</span>
        <span className="text-white">{poState.action}</span>
      </div>
    </div>
  );
};

export default PoStatus;
