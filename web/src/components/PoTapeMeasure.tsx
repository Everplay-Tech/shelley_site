"use client";

import { useRef, useCallback, useEffect, useState } from "react";

/**
 * PoTapeMeasure — Tape measure snap-back animation.
 *
 * Layers:
 *   1. Po body (craftsman sprite frame 0, wobbles on snap)
 *   2. Tape measure housing (pure CSS, in Po's hand area)
 *   3. Tape blade (extends left from housing, snaps back)
 *   4. Impact stars (diamond shapes flash around head on snap)
 *
 * Comedy: Po extends a tape measure, it snaps back and jolts him.
 * Each snap makes the wobble worse. After MAX_SNAPS, big recoil + reset.
 */

// ─── Timing ────────────────────────────────────────────────────────────────────
const CYCLE_SEC = 3.2;

// ─── Layout (% of container) ───────────────────────────────────────────────────
const HOUSING_X = 33; // from left — Po's left hand
const HOUSING_Y = 55;
const HOUSING_W = 8;
const HOUSING_H = 10;

const BLADE_MAX_PCT = 55; // max blade extend as % of container

// ─── Progressive wobble ────────────────────────────────────────────────────────
const MAX_SNAPS = 5;
const BASE_WOBBLE_DEG = 6;
const WOBBLE_PER_SNAP = 2.5; // extra degrees per snap
const BASE_WOBBLE_PX = 2;
const SHIFT_PER_SNAP = 1.2;

// ─── Craftsman static sprite (128x128 south rotation from PixelLab) ────────────
const SPRITE_PATH = "/sprites/po/costumes/craftsman_static.png";

interface PoTapeMeasureProps {
  size?: number;
  className?: string;
}

export default function PoTapeMeasure({
  size = 128,
  className = "",
}: PoTapeMeasureProps) {
  const bladeRef = useRef<HTMLDivElement>(null);
  const [snapCount, setSnapCount] = useState(0);
  const [impacting, setImpacting] = useState(false);

  const maxExtendPx = Math.round(size * BLADE_MAX_PCT / 100);

  // Count snaps via animationiteration on the blade
  const handleIteration = useCallback(() => {
    setImpacting(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setImpacting(false));
    });

    setSnapCount((prev) => (prev >= MAX_SNAPS ? 0 : prev + 1));
  }, []);

  useEffect(() => {
    const el = bladeRef.current;
    if (!el) return;
    el.addEventListener("animationiteration", handleIteration);
    return () => el.removeEventListener("animationiteration", handleIteration);
  }, [handleIteration]);

  // Progressive wobble intensity
  const wobbleDeg = BASE_WOBBLE_DEG + snapCount * WOBBLE_PER_SNAP;
  const wobblePx = BASE_WOBBLE_PX + snapCount * SHIFT_PER_SNAP;
  // Extra jolt on impact frame
  const impactExtra = impacting ? 1.4 : 1;

  // Star positions (3 diamonds around head area)
  const stars = [
    { x: 55, y: 8, delay: 0 },
    { x: 38, y: 5, delay: 0.04 },
    { x: 65, y: 18, delay: 0.08 },
  ];

  return (
    <div
      className={`po-tape-measure ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        overflow: "visible",
      }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Layer 1: Po body — craftsman frame 0, wobbles on snap */}
      <div
        className="po-tape-body"
        style={
          {
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${SPRITE_PATH})`,
            backgroundSize: `${size}px ${size}px`,
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
            transformOrigin: "bottom center",
            "--wobble-deg": `${wobbleDeg * impactExtra}deg`,
            "--wobble-px": `${wobblePx * impactExtra}px`,
            animation: `tape-wobble ${CYCLE_SEC}s ease-in-out infinite`,
          } as React.CSSProperties
        }
      />

      {/* Layer 2: Tape measure housing */}
      <div
        className="po-tape-housing"
        style={{
          position: "absolute",
          left: `${HOUSING_X}%`,
          top: `${HOUSING_Y}%`,
          width: `${HOUSING_W}%`,
          height: `${HOUSING_H}%`,
          background: "#cc3333",
          borderRadius: 2,
          boxShadow: "inset -1px -1px 0 #991111, inset 1px 1px 0 #ee5555",
          zIndex: 2,
          animation: `tape-wobble ${CYCLE_SEC}s ease-in-out infinite`,
          transformOrigin: "center center",
          "--wobble-deg": `${wobbleDeg * impactExtra * 0.5}deg`,
          "--wobble-px": `${wobblePx * impactExtra * 0.5}px`,
        } as React.CSSProperties}
      />

      {/* Layer 3: Tape blade — extends left, snaps back */}
      <div
        ref={bladeRef}
        className="po-tape-blade"
        style={
          {
            position: "absolute",
            right: `${100 - HOUSING_X}%`,
            top: `${HOUSING_Y + HOUSING_H / 2 - 1}%`,
            height: 3,
            background: `repeating-linear-gradient(
              to left,
              #ffd700 0px, #ffd700 4px,
              #b8860b 4px, #b8860b 5px
            )`,
            transformOrigin: "right center",
            "--tape-max": `${maxExtendPx}px`,
            animation: `tape-extend ${CYCLE_SEC}s ease-in-out infinite`,
            zIndex: 1,
          } as React.CSSProperties
        }
      />

      {/* Blade end tab (the hook/clip at the tip) */}
      <div
        className="po-tape-tip"
        style={
          {
            position: "absolute",
            right: `${100 - HOUSING_X}%`,
            top: `${HOUSING_Y + HOUSING_H / 2 - 2.5}%`,
            width: 3,
            height: 5,
            background: "#b8860b",
            transformOrigin: "right center",
            "--tape-max": `${maxExtendPx}px`,
            animation: `tape-tip ${CYCLE_SEC}s ease-in-out infinite`,
            zIndex: 1,
          } as React.CSSProperties
        }
      />

      {/* Layer 4: Impact stars */}
      <div
        className="po-tape-stars"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          animation: `tape-stars ${CYCLE_SEC}s ease-in-out infinite`,
          zIndex: 3,
        }}
      >
        {stars.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: 5,
              height: 5,
              background: "#ffbf00",
              transform: "rotate(45deg)",
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
