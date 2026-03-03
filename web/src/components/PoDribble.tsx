"use client";

import { useRef, useCallback, useEffect, useState } from "react";

/**
 * PoDribble — Ball bouncing off Po's head animation.
 *
 * Layers:
 *   1. Po body (static south.png + progressive squish per bounce)
 *   2. Basketball (gravity bounce: rests on head, launches up, falls back)
 *
 * Comedy: Po gets shorter with each bonk, then pops back after a few hits.
 */

// Layout constants (% of 128px container)
const BALL_X = 50;     // centered on head
const BALL_Y = 4;      // resting on beanie
const BALL_SIZE = 13;
const BOUNCE_UP = 30;  // how high ball goes

// Timing & squish
const BONK_SEC = 1.2;
const SQUISH_PER_BONK = 0.025;  // 2.5% shorter each bonk
const MAX_BONKS = 6;             // pop back after this many
const SQUISH_SPRING = 0.06;      // extra momentary squish on impact

interface PoDribbleProps {
  size?: number;
  className?: string;
}

export default function PoDribble({ size = 128, className = "" }: PoDribbleProps) {
  const ballPx = Math.round(size * BALL_SIZE / 100);
  const bouncePx = Math.round(size * BOUNCE_UP / 100);

  const [bonkCount, setBonkCount] = useState(0);
  const [impacting, setImpacting] = useState(false);
  const ballRef = useRef<HTMLDivElement>(null);

  // Count bounces via animationiteration event
  const handleBounce = useCallback(() => {
    // Flash the impact squish
    setImpacting(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setImpacting(false));
    });

    setBonkCount((prev) => {
      if (prev >= MAX_BONKS) return 0; // pop back!
      return prev + 1;
    });
  }, []);

  useEffect(() => {
    const el = ballRef.current;
    if (!el) return;
    el.addEventListener("animationiteration", handleBounce);
    return () => el.removeEventListener("animationiteration", handleBounce);
  }, [handleBounce]);

  // Progressive squish: each bonk makes Po shorter (from the feet up)
  const baseSquish = 1 - bonkCount * SQUISH_PER_BONK;
  const impactExtra = impacting ? SQUISH_SPRING : 0;
  const scaleY = Math.max(baseSquish - impactExtra, 0.75); // floor at 75%
  const scaleX = 1 + (1 - scaleY) * 0.3; // slight widening to compensate

  return (
    <div
      className={`po-dribble ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        overflow: "visible",
      }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Layer 1: Po body — progressively squished */}
      <div
        className="po-bonk-body"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/sprites/po/idle_static.png)",
          backgroundSize: `${size}px ${size}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated" as const,
          transformOrigin: "bottom center",
          transform: `scaleY(${scaleY}) scaleX(${scaleX})`,
          transition: bonkCount === 0
            ? "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" // springy pop-back
            : "transform 0.08s ease-out", // quick squish
        }}
      />

      {/* Layer 2: Basketball */}
      <div
        ref={ballRef}
        className="po-dribble-ball"
        style={
          {
            position: "absolute",
            left: `${BALL_X}%`,
            top: `${BALL_Y}%`,
            width: ballPx,
            height: ballPx,
            marginLeft: -(ballPx / 2),
            marginTop: -(ballPx / 2),
            backgroundImage: "url(/sprites/po/basketball.png)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated" as const,
            "--bonk-height": `${bouncePx}px`,
            animation: `bonk-ball ${BONK_SEC}s linear infinite`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
