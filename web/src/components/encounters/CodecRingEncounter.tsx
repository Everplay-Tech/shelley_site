"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { usePoEncounter } from "@/hooks/usePoEncounter";

// ─── Mini Crystal Bonsai ────────────────────────────────────────────────────
// Simplified version of CrystalBonsai for 60px encounter trigger.
// Trunk + one orbital ring + base glow. Feels like a "device receiving signal".
function MiniCrystalBonsai() {
  return (
    <svg
      viewBox="0 0 60 70"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="codec-ring-bonsai-svg"
    >
      <defs>
        <radialGradient id="crb-base-glow" cx="50%" cy="90%" r="45%">
          <stop offset="0%" stopColor="#00fff2" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00fff2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="crb-trunk" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f0ff" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#00fff2" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#e0f0ff" stopOpacity="0.4" />
        </linearGradient>
        <radialGradient id="crb-tip" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffbf00" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffbf00" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Base glow */}
      <ellipse cx="30" cy="62" rx="20" ry="6" fill="url(#crb-base-glow)" />

      {/* Trunk */}
      <polygon
        points="27,62 25,48 27,38 29,28 30,24 31,28 33,38 35,48 33,62"
        fill="url(#crb-trunk)"
        stroke="#00fff2"
        strokeWidth="0.5"
        strokeOpacity="0.4"
      />

      {/* Crown tip */}
      <circle cx="30" cy="22" r="3" fill="url(#crb-tip)" />

      {/* Branch stubs */}
      <polygon points="25,42 18,36 20,34 27,38" fill="#e0f0ff" fillOpacity="0.3" />
      <polygon points="35,42 42,37 40,35 33,38" fill="#e0f0ff" fillOpacity="0.3" />

      {/* Orbital ring */}
      <ellipse
        cx="30"
        cy="40"
        rx="24"
        ry="8"
        fill="none"
        stroke="#00fff2"
        strokeWidth="0.6"
        strokeOpacity="0.25"
        className="codec-ring-orbit"
      />

      {/* Energy particle */}
      <circle r="1.5" fill="#00fff2" fillOpacity="0.8">
        <animateMotion
          dur="4s"
          repeatCount="indefinite"
          path="M54,40 A24,8 0 1,1 6,40 A24,8 0 1,1 54,40"
        />
      </circle>

      {/* Base shards */}
      <polygon points="22,62 20,56 24,58" fill="#e0f0ff" fillOpacity="0.15" />
      <polygon points="38,62 40,57 36,59" fill="#e0f0ff" fillOpacity="0.12" />
    </svg>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────
const RING_CYCLE_MS = 2000;
const RING_COUNT = 3;
const JITTER_DURATION_MS = 600;
const JITTER_INTERVAL_MS = 100;
const ENTER_DURATION_MS = 300;
const EXIT_DURATION_MS = 300;
const ACCEPT_FLASH_MS = 150;

// ─── Component ───────────────────────────────────────────────────────────────
export default function CodecRingEncounter() {
  const {
    activeEncounter,
    encounterPhase,
    acceptEncounter,
    dismissEncounter,
    clearEncounter,
  } = usePoEncounter();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const [jitterOffset, setJitterOffset] = useState({ x: 0, y: 0 });
  const [activeWave, setActiveWave] = useState(-1); // current wave cycle (0,1,2), -1 = none
  const [waveKey, setWaveKey] = useState(0); // force re-mount for animation replay
  const [isPulsing, setIsPulsing] = useState(false);

  // Cleanup helper
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timersRef.current = [];
    intervalsRef.current = [];
  }, []);

  // Register a timeout that gets cleaned up
  const addTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  // ── Phase: entering → auto-transition to waiting ──
  useEffect(() => {
    if (activeEncounter !== "codec_ring") return;
    if (encounterPhase !== "entering") return;

    // Auto-focus the button after entrance animation
    const id = addTimeout(() => {
      buttonRef.current?.focus();
    }, ENTER_DURATION_MS);

    return () => clearTimeout(id);
  }, [activeEncounter, encounterPhase, addTimeout]);

  // ── Phase: waiting → 3 ring cycles then dismiss ──
  useEffect(() => {
    if (activeEncounter !== "codec_ring") return;
    if (encounterPhase !== "waiting") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cycleCount = 0;

    const runCycle = () => {
      if (cycleCount >= RING_COUNT) {
        dismissEncounter();
        return;
      }

      // a) Jitter
      if (!reducedMotion) {
        let jitterTicks = 0;
        const jitterId = setInterval(() => {
          jitterTicks++;
          if (jitterTicks > JITTER_DURATION_MS / JITTER_INTERVAL_MS) {
            clearInterval(jitterId);
            setJitterOffset({ x: 0, y: 0 });
            return;
          }
          setJitterOffset({
            x: (Math.random() * 2 - 1) * 2,
            y: (Math.random() * 2 - 1) * 2,
          });
        }, JITTER_INTERVAL_MS);
        intervalsRef.current.push(jitterId);
      }

      // b) Energy wave
      setActiveWave(cycleCount);
      setWaveKey((k) => k + 1);

      // c) Pulse
      setIsPulsing(true);
      addTimeout(() => setIsPulsing(false), 800);

      cycleCount++;
      addTimeout(runCycle, RING_CYCLE_MS);
    };

    // Start first cycle immediately
    runCycle();

    return clearAllTimers;
  }, [activeEncounter, encounterPhase, dismissEncounter, addTimeout, clearAllTimers]);

  // ── Phase: dismissed / exiting → animate out then clear ──
  useEffect(() => {
    if (activeEncounter !== "codec_ring") return;
    if (encounterPhase !== "dismissed") return;

    const id = addTimeout(() => {
      clearEncounter();
    }, EXIT_DURATION_MS);

    return () => clearTimeout(id);
  }, [activeEncounter, encounterPhase, clearEncounter, addTimeout]);

  // ── Phase: accepted → flash then clear ──
  useEffect(() => {
    if (activeEncounter !== "codec_ring") return;
    if (encounterPhase !== "accepted") return;

    const id = addTimeout(() => {
      clearEncounter();
    }, ACCEPT_FLASH_MS + 150);

    return () => clearTimeout(id);
  }, [activeEncounter, encounterPhase, clearEncounter, addTimeout]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return clearAllTimers;
  }, [clearAllTimers]);

  // ── Gate: only render for codec_ring ──
  if (activeEncounter !== "codec_ring") return null;
  if (encounterPhase === "idle") return null;

  // ── Phase-based class names ──
  const phaseClass =
    encounterPhase === "entering"
      ? "codec-ring-enter"
      : encounterPhase === "waiting"
        ? "codec-ring-waiting"
        : encounterPhase === "accepted"
          ? "codec-ring-accepted"
          : encounterPhase === "dismissed"
            ? "codec-ring-exit"
            : "";

  const pulseClass = isPulsing ? "codec-ring-pulse" : "";

  return (
    <>
      <style>{codecRingStyles}</style>
      <div className={`codec-ring-corner-glow ${phaseClass}`} />
      <button
        ref={buttonRef}
        className={`codec-ring-container ${phaseClass} ${pulseClass}`}
        onClick={acceptEncounter}
        aria-label="Incoming transmission — click to answer"
        style={{
          transform: encounterPhase === "waiting"
            ? `translate(${jitterOffset.x}px, ${jitterOffset.y}px)`
            : undefined,
        }}
      >
        <MiniCrystalBonsai />
        {/* Energy waves */}
        {encounterPhase === "waiting" && activeWave >= 0 && (
          <div className="codec-ring-waves" key={waveKey}>
            <div className="codec-ring-wave codec-ring-wave-active" />
          </div>
        )}
      </button>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const codecRingStyles = /* css */ `
/* ── Container ── */
.codec-ring-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  z-index: 55;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  /* Prevent layout shift from jitter */
  will-change: transform;
}

.codec-ring-container:focus-visible {
  outline: 2px solid #00fff2;
  outline-offset: 4px;
  border-radius: 4px;
}

/* ── Corner glow ── */
.codec-ring-corner-glow {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 200px;
  height: 200px;
  pointer-events: none;
  z-index: 54;
  background: radial-gradient(
    circle at bottom right,
    rgba(0, 255, 242, 0.08) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 300ms steps(4);
}

.codec-ring-corner-glow.codec-ring-enter,
.codec-ring-corner-glow.codec-ring-waiting {
  opacity: 1;
}

.codec-ring-corner-glow.codec-ring-exit,
.codec-ring-corner-glow.codec-ring-accepted {
  opacity: 0;
}

/* ── Enter animation ── */
.codec-ring-container.codec-ring-enter {
  animation: codec-ring-materialize 300ms steps(4) forwards;
}

@keyframes codec-ring-materialize {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  25% {
    opacity: 0.3;
  }
  50% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  75% {
    transform: scale(0.9);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ── Waiting (pulse on bonsai) ── */
.codec-ring-container.codec-ring-pulse {
  animation: codec-ring-bonsai-pulse 800ms ease-in-out;
}

@keyframes codec-ring-bonsai-pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* ── Exit animation ── */
.codec-ring-container.codec-ring-exit {
  animation: codec-ring-dematerialize 300ms steps(4) forwards;
}

@keyframes codec-ring-dematerialize {
  0% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  100% {
    transform: scale(0) translateY(20px);
    opacity: 0;
  }
}

/* ── Accepted flash ── */
.codec-ring-container.codec-ring-accepted {
  animation: codec-ring-accept-flash 300ms steps(4) forwards;
}

@keyframes codec-ring-accept-flash {
  0% {
    filter: brightness(1);
    opacity: 1;
  }
  50% {
    filter: brightness(1.5);
    opacity: 1;
  }
  100% {
    filter: brightness(1.5);
    opacity: 0;
  }
}

/* ── Energy waves ── */
.codec-ring-waves {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.codec-ring-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  border: 1px solid #00fff2;
  opacity: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.codec-ring-wave.codec-ring-wave-active {
  animation: codec-ring-wave-expand 800ms ease-out forwards;
}

@keyframes codec-ring-wave-expand {
  0% {
    width: 0;
    height: 0;
    opacity: 0.8;
  }
  100% {
    width: 50px;
    height: 50px;
    opacity: 0;
  }
}

/* ── Orbit ring subtle glow during waiting ── */
.codec-ring-container.codec-ring-waiting .codec-ring-orbit {
  stroke-opacity: 0.5;
  transition: stroke-opacity 300ms;
}

/* ── Mobile: bottom-center above nav ── */
@media (max-width: 768px) {
  .codec-ring-container {
    left: calc(50% - 30px);
    right: auto;
    bottom: 72px; /* above nav bar */
  }

  .codec-ring-corner-glow {
    left: calc(50% - 100px);
    right: auto;
    background: radial-gradient(
      circle at center bottom,
      rgba(0, 255, 242, 0.08) 0%,
      transparent 60%
    );
  }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .codec-ring-container.codec-ring-enter,
  .codec-ring-container.codec-ring-exit,
  .codec-ring-container.codec-ring-accepted {
    animation: none;
  }

  .codec-ring-container.codec-ring-enter {
    opacity: 1;
    transform: scale(1);
  }

  .codec-ring-container.codec-ring-exit {
    opacity: 0;
  }

  .codec-ring-container.codec-ring-accepted {
    opacity: 0;
  }

  .codec-ring-container.codec-ring-pulse {
    animation: none;
  }

  /* Gentle opacity pulse instead */
  .codec-ring-container.codec-ring-waiting {
    animation: codec-ring-reduced-pulse 2s ease-in-out infinite;
  }

  @keyframes codec-ring-reduced-pulse {
    0%, 100% { opacity: 0.7; }
    50%      { opacity: 1; }
  }

  .codec-ring-wave {
    display: none;
  }

  .codec-ring-bonsai-svg circle animateMotion {
    /* SVG animateMotion can't be easily disabled via CSS,
       but the overall container pulse provides the signal */
  }
}
`;
