"use client";

import React, { useState, useEffect } from "react";
import { GodotEvent } from "@/lib/godot-messages";

const PoStatus: React.FC = () => {
  const [poState, setPoState] = useState({
    mood: "Happy",
    score: 0,
    lastAction: "Resting"
  });

  // This would ideally listen to global events or state
  // For now, it's just a placeholder for Po's global state

  return (
    <div className="bg-shelley-charcoal/50 backdrop-blur-sm border border-white/10 p-4 rounded-lg text-sm">
      <h3 className="text-shelley-amber font-bold mb-2 uppercase tracking-wider">Po's Status</h3>
      <div className="grid grid-cols-2 gap-2 text-white/80">
        <span>Mood:</span>
        <span className="text-white">{poState.mood}</span>
        <span>Score:</span>
        <span className="text-white">{poState.score}</span>
        <span>Action:</span>
        <span className="text-white">{poState.lastAction}</span>
      </div>
    </div>
  );
};

export default PoStatus;
