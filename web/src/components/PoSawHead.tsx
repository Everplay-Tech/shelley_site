"use client";

import { useRef, useCallback, useEffect, useState } from "react";

/**
 * PoSawHead — Po saws his own head off.
 *
 * Layers:
 *   1. Po body (neck down — static, clip-path)
 *   2. Po head (above neck — detaches, bounces, reconnects)
 *   3. Saw (tiny blade + handle at neck, oscillates during sawing phase)
 *   4. Impact stars (flash when head reconnects)
 *
 * Two copies of the same static sprite, split by clip-path at the neck.
 * Head layer gets translateY animation to pop off and bounce back.
 */

// ─── Timing ────────────────────────────────────────────────────────────────────
const CYCLE_SEC = 4.0;

// ─── Neck split (% from top of 128px canvas) ──────────────────────────────────
// Craftsman Po: hood top ~16%, neck ~44%
const NECK_Y = 44;

// ─── Circular saw layout ───────────────────────────────────────────────────────
const SAW_SIZE = 30; // blade diameter in px
const SAW_X = 18;    // from left (overlaps neck on Po's left side)


// ─── Head bounce ───────────────────────────────────────────────────────────────
const HEAD_POP_BASE = 22; // base bounce height as % of container

// ─── Progressive state ─────────────────────────────────────────────────────────
const MAX_POPS = 5;
const POP_GROWTH = 0.12; // each pop goes 12% higher

// ─── Sprite ────────────────────────────────────────────────────────────────────
const SPRITE_PATH = "/sprites/po/costumes/craftsman_static.png";

interface PoSawHeadProps {
  size?: number;
  className?: string;
}

export default function PoSawHead({
  size = 128,
  className = "",
}: PoSawHeadProps) {
  const headRef = useRef<HTMLDivElement>(null);
  const [popCount, setPopCount] = useState(0);

  const popMultiplier = 1 + popCount * POP_GROWTH;
  const headPopPx = Math.round(size * HEAD_POP_BASE / 100 * popMultiplier);

  // Count pops via animationiteration on the head layer
  const handleIteration = useCallback(() => {
    setPopCount((prev) => (prev >= MAX_POPS ? 0 : prev + 1));
  }, []);

  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    el.addEventListener("animationiteration", handleIteration);
    return () => el.removeEventListener("animationiteration", handleIteration);
  }, [handleIteration]);

  const spriteStyle = {
    backgroundImage: `url(${SPRITE_PATH})`,
    backgroundSize: `${size}px ${size}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated" as const,
  };

  return (
    <div
      className={`po-saw-head ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        overflow: "visible",
      }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Layer 1: Body (neck down) — stays put */}
      <div
        className="po-saw-body"
        style={{
          position: "absolute",
          inset: 0,
          ...spriteStyle,
          clipPath: `inset(${NECK_Y}% 0 0 0)`,
        }}
      />

      {/* Layer 2: Head (above neck) — detaches and bounces */}
      <div
        ref={headRef}
        className="po-saw-head-piece"
        style={
          {
            position: "absolute",
            inset: 0,
            ...spriteStyle,
            clipPath: `inset(0 0 ${100 - NECK_Y}% 0)`,
            transformOrigin: "center bottom",
            "--head-pop": `${headPopPx}px`,
            animation: `head-detach ${CYCLE_SEC}s ease-in-out infinite`,
          } as React.CSSProperties
        }
      />

      {/* Layer 3: Circular saw — sweeps across neck, hidden during head pop */}
      <div
        className="po-saw-tool"
        style={
          {
            position: "absolute",
            left: `${SAW_X}%`,
            top: `${NECK_Y - 2}%`,
            width: SAW_SIZE,
            height: SAW_SIZE,
            marginTop: -(SAW_SIZE / 2),
            "--saw-sweep": `${Math.round(size * 0.35)}px`,
            animation: `saw-sweep ${CYCLE_SEC}s ease-in-out infinite`,
            zIndex: 2,
          } as React.CSSProperties
        }
      >
        {/* Spinning blade */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: `conic-gradient(
              #999 0deg, #bbb 15deg, #999 30deg, #bbb 45deg,
              #999 60deg, #bbb 75deg, #999 90deg, #bbb 105deg,
              #999 120deg, #bbb 135deg, #999 150deg, #bbb 165deg,
              #999 180deg, #bbb 195deg, #999 210deg, #bbb 225deg,
              #999 240deg, #bbb 255deg, #999 270deg, #bbb 285deg,
              #999 300deg, #bbb 315deg, #999 330deg, #bbb 345deg
            )`,
            border: "1px solid #777",
            boxShadow: "0 0 3px rgba(0,0,0,0.5)",
            animation: `saw-spin 0.15s linear infinite`,
            // Gear-tooth edge
            clipPath:
              "polygon(" +
              "50% 0%, 58% 6%, 71% 2%, 74% 12%, 87% 13%, 85% 24%," +
              "96% 31%, 90% 40%, 98% 50%, 90% 60%, 96% 69%," +
              "85% 76%, 87% 87%, 74% 88%, 71% 98%, 58% 94%," +
              "50% 100%, 42% 94%, 29% 98%, 26% 88%, 13% 87%," +
              "15% 76%, 4% 69%, 10% 60%, 2% 50%, 10% 40%," +
              "4% 31%, 15% 24%, 13% 13%, 26% 12%, 29% 2%, 42% 6%)",
          }}
        >
          {/* Axle hole */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 6,
              height: 6,
              marginTop: -3,
              marginLeft: -3,
              borderRadius: "50%",
              background: "#555",
              border: "1px solid #444",
            }}
          />
        </div>
      </div>

      {/* Layer 4: Stars — flash on reconnect */}
      <div
        className="po-saw-stars"
        style={{
          position: "absolute",
          left: "20%",
          top: `${NECK_Y - 8}%`,
          width: "60%",
          height: "15%",
          animation: `saw-stars ${CYCLE_SEC}s ease-in-out infinite`,
          pointerEvents: "none",
          zIndex: 3,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 5,
              height: 5,
              background: "#ffbf00",
              transform: "rotate(45deg)",
              left: `${10 + i * 35}%`,
              top: `${i === 1 ? 0 : 55}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
