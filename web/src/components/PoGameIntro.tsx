"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ZONES, type ZoneId } from "@/lib/zone-config";

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
  account: [
    "Your space awaits...",
    "Let's check in!",
    "Everything's here...",
  ],
  contact: [
    "Signal incoming...",
    "Let's make contact!",
    "Reaching out!",
  ],
};

// Zone-specific portrait paintings
const INTRO_PORTRAITS: Record<ZoneId, string> = {
  workshop: "/images/intro/workshop.png",
  gallery: "/images/intro/gallery.png",
  account: "/images/intro/librarynth.png",
  contact: "/images/intro/contact.png",
};

interface PoGameIntroProps {
  zoneId: ZoneId;
  onComplete: () => void;
}

const PoGameIntro: React.FC<PoGameIntroProps> = ({ zoneId, onComplete }) => {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const zone = ZONES[zoneId];

  const line = useMemo(() => {
    const lines = INTRO_LINES[zoneId];
    return lines[Math.floor(Math.random() * lines.length)];
  }, [zoneId]);

  useEffect(() => {
    // enter: 800ms fade in + scale → hold: 2200ms display → exit: 700ms dissolve out
    const enterTimer = setTimeout(() => setPhase("hold"), 800);
    const holdTimer = setTimeout(() => setPhase("exit"), 3000);
    const exitTimer = setTimeout(() => onComplete(), 3700);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div className="po-intro-portrait">
      {/* Dark vignette backdrop */}
      <div
        className={`po-intro-backdrop ${phase !== "enter" ? "po-intro-backdrop--visible" : ""}`}
      />

      {/* Portrait painting */}
      <div
        className={`po-intro-painting ${
          phase === "enter"
            ? "po-intro-painting--enter"
            : phase === "exit"
              ? "po-intro-painting--exit"
              : "po-intro-painting--hold"
        }`}
      >
        {/* Ornate frame glow */}
        <div
          className="po-intro-frame-glow"
          style={{ boxShadow: `0 0 60px 20px ${zone.accentHex}33, 0 0 120px 40px ${zone.accentHex}11` }}
        />

        {/* The painting image */}
        <img
          src={INTRO_PORTRAITS[zoneId]}
          alt=""
          className="po-intro-painting-img"
          aria-hidden="true"
          draggable={false}
        />
      </div>

      {/* Speech bubble — visible during hold phase */}
      <div
        className={`po-intro-speech ${phase === "hold" ? "po-intro-speech--visible" : ""}`}
      >
        <span className="font-pixel" style={{ color: zone.accentHex, fontSize: "11px", letterSpacing: "0.1em" }}>
          {line}
        </span>
      </div>

      {/* Zone name plate */}
      <div
        className={`po-intro-nameplate ${phase === "hold" ? "po-intro-nameplate--visible" : ""}`}
        style={{ borderColor: `${zone.accentHex}44` }}
      >
        <span className="font-pixel" style={{ color: zone.accentHex, fontSize: "8px", letterSpacing: "0.2em" }}>
          {zone.name}
        </span>
      </div>
    </div>
  );
};

export default PoGameIntro;
