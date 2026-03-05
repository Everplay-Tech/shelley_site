"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ZONES, PO_COSTUMES, type ZoneId } from "@/lib/zone-config";

// Zone-specific intro lines Po says before a game
const INTRO_LINES: Record<ZoneId, string[]> = {
  workshop: [
    "Let's build something...",
    "Time to get crafty!",
    "Grab your tools!",
  ],
  gallery: [
    "Check this out...",
    "Feast your eyes!",
    "Art time!",
  ],
  librarynth: [
    "Into the labyrinth...",
    "Knowledge awaits!",
    "Don't get lost...",
  ],
  contact: [
    "Signal incoming...",
    "Let's make contact!",
    "Reaching out!",
  ],
};

interface PoGameIntroProps {
  zoneId: ZoneId;
  onComplete: () => void;
}

const PoGameIntro: React.FC<PoGameIntroProps> = ({ zoneId, onComplete }) => {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const zone = ZONES[zoneId];
  const costume = PO_COSTUMES[zone.poCostume];

  const line = useMemo(() => {
    const lines = INTRO_LINES[zoneId];
    return lines[Math.floor(Math.random() * lines.length)];
  }, [zoneId]);

  useEffect(() => {
    // enter: 600ms slide up → hold: 2500ms display → exit: 600ms slide away
    const enterTimer = setTimeout(() => setPhase("hold"), 600);
    const holdTimer = setTimeout(() => setPhase("exit"), 3100);
    const exitTimer = setTimeout(() => onComplete(), 3700);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div className="po-game-intro">
      {/* Speech bubble — visible during hold phase */}
      <div
        className={`po-game-intro-bubble ${phase === "hold" ? "po-game-intro-bubble-visible" : ""}`}
      >
        <span className="font-pixel" style={{ color: zone.accentHex, fontSize: "10px" }}>
          {line}
        </span>
      </div>

      {/* Po sprite cutout */}
      <div
        className={`po-game-intro-sprite ${
          phase === "enter"
            ? "po-game-intro-sprite-enter"
            : phase === "exit"
              ? "po-game-intro-sprite-exit"
              : ""
        }`}
        style={{
          backgroundImage: `url(${costume.sheetPath})`,
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default PoGameIntro;
