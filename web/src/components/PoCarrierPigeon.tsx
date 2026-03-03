"use client";

import { useRef, useCallback, useEffect, useState } from "react";

/**
 * PoCarrierPigeon — Pigeons collect all over Po (Contact / Messenger zone).
 *
 * Layers:
 *   1. Po body (static messenger sprite, sinks under weight)
 *   2-8. Pigeons (CSS geometric birds, land across body + ground)
 *
 * Cycle: pigeons arrive one per tick, land on head/shoulders/bag/ground →
 *        Po sinks → after all pigeons land → they all fly away → Po springs back → repeat
 */

// ─── Timing ─────────────────────────────────────────────────────────────────
const CYCLE_SEC = 2.5; // seconds per pigeon arrival
const FLY_AWAY_MS = 1200; // how long the fly-away animation takes

// ─── Progressive state ──────────────────────────────────────────────────────
const MAX_PIGEONS = 7;
const SINK_PER_PIGEON = 1.5; // % Po sinks per pigeon
const SQUISH_PER_PIGEON = 0.012; // scaleY compression per pigeon

// ─── Sprite ─────────────────────────────────────────────────────────────────
const SPRITE_PATH = "/sprites/po/costumes/messenger_static.png";

// ─── Pigeon landing spots ───────────────────────────────────────────────────
// Spread across head, shoulders, body, and ground
// x/y as % of container, facing: which way the bird faces
// flyDir: angle in degrees the pigeon flies away (0=right, 90=down, 270=up)
const PIGEON_SPOTS = [
  // Head
  { x: 46, y: 10, facing: "right", wobbleDelay: 0, flyAngle: 300, flyDist: 160 },
  // Right shoulder
  { x: 62, y: 30, facing: "right", wobbleDelay: 0.2, flyAngle: 340, flyDist: 140 },
  // Left shoulder / bag strap
  { x: 30, y: 28, facing: "left", wobbleDelay: 0.1, flyAngle: 220, flyDist: 150 },
  // On the messenger bag
  { x: 58, y: 48, facing: "left", wobbleDelay: 0.35, flyAngle: 30, flyDist: 130 },
  // Ground left
  { x: 18, y: 78, facing: "right", wobbleDelay: 0.15, flyAngle: 240, flyDist: 120 },
  // Ground right
  { x: 72, y: 80, facing: "left", wobbleDelay: 0.25, flyAngle: 310, flyDist: 140 },
  // Top of head (last one, perches on top of first)
  { x: 50, y: 2, facing: "right", wobbleDelay: 0.05, flyAngle: 270, flyDist: 170 },
];

// ─── Pigeon colors ──────────────────────────────────────────────────────────
const PIGEON_COLORS = [
  { body: "#b0b0b0", wing: "#909090", beak: "#e8a030" },
  { body: "#c8c8c8", wing: "#a0a0a0", beak: "#d09020" },
  { body: "#a0a8b0", wing: "#808890", beak: "#e8a030" },
  { body: "#b8b0a8", wing: "#988880", beak: "#d09020" },
  { body: "#c0c0c0", wing: "#989898", beak: "#e8a030" },
  { body: "#d0c8c0", wing: "#a89888", beak: "#d09020" },
  { body: "#b8b8c0", wing: "#9090a0", beak: "#e8a030" },
];

interface PoCarrierPigeonProps {
  size?: number;
  className?: string;
}

export default function PoCarrierPigeon({
  size = 128,
  className = "",
}: PoCarrierPigeonProps) {
  const timerRef = useRef<HTMLDivElement>(null);
  const [pigeonCount, setPigeonCount] = useState(0);
  const [isFlyingAway, setIsFlyingAway] = useState(false);

  const handleIteration = useCallback(() => {
    setPigeonCount((prev) => {
      if (prev >= MAX_PIGEONS) {
        // All pigeons fly away, then reset
        setIsFlyingAway(true);
        setTimeout(() => {
          setIsFlyingAway(false);
        }, FLY_AWAY_MS);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  useEffect(() => {
    const el = timerRef.current;
    if (!el) return;
    el.addEventListener("animationiteration", handleIteration);
    return () => el.removeEventListener("animationiteration", handleIteration);
  }, [handleIteration]);

  // Po sinks and compresses under pigeon weight
  const sinkY = isFlyingAway ? 0 : pigeonCount * SINK_PER_PIGEON;
  const scaleY = isFlyingAway ? 1 : 1 - pigeonCount * SQUISH_PER_PIGEON;
  const scaleX = 1 + (1 - scaleY) * 0.3;

  // Pigeon size relative to container
  const pigeonW = Math.round(size * 14 / 100);
  const pigeonH = Math.round(size * 10 / 100);

  return (
    <div
      className={`po-carrier-pigeon ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        overflow: "visible",
      }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Hidden animation timer — drives the cycle */}
      <div
        ref={timerRef}
        className="po-pigeon-timer"
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          animation: `pigeon-timer ${CYCLE_SEC}s linear infinite`,
          pointerEvents: "none",
        }}
      />

      {/* Layer 1: Po body — sinks under weight, springs back when pigeons leave */}
      <div
        className="po-pigeon-body"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${SPRITE_PATH})`,
          backgroundSize: `${size}px ${size}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated" as const,
          transformOrigin: "bottom center",
          transform: `translateY(${sinkY}%) scaleY(${scaleY}) scaleX(${scaleX})`,
          transition: pigeonCount === 0 || isFlyingAway
            ? "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" // springy pop-back
            : "transform 0.15s ease-out",
          zIndex: 1,
        }}
      />

      {/* Pigeon layers — land across body and ground */}
      {PIGEON_SPOTS.map((spot, i) => {
        const wasLanded = i < pigeonCount || (pigeonCount === 0 && isFlyingAway);
        const isLanded = i < pigeonCount && !isFlyingAway;
        const isArriving = i === pigeonCount - 1 && pigeonCount > 0 && !isFlyingAway;
        const colors = PIGEON_COLORS[i];

        // Fly-away destination (CSS custom properties)
        const flyRad = (spot.flyAngle * Math.PI) / 180;
        const flyX = Math.cos(flyRad) * spot.flyDist;
        const flyY = Math.sin(flyRad) * spot.flyDist;

        // Ground pigeons sit below Po (higher z), body pigeons sit on top
        const isGroundPigeon = spot.y >= 70;
        const zIndex = isGroundPigeon ? 3 : 5 + i;

        let animation = "none";
        if (isFlyingAway && wasLanded) {
          animation = `pigeon-fly-away ${FLY_AWAY_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${i * 80}ms forwards`;
        } else if (isArriving) {
          animation = `pigeon-land ${CYCLE_SEC * 0.4}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
        } else if (isLanded) {
          animation = `pigeon-wobble 1.2s ease-in-out ${spot.wobbleDelay}s infinite`;
        }

        return (
          <div
            key={i}
            className="po-pigeon-bird"
            style={
              {
                position: "absolute",
                left: `${spot.x}%`,
                top: `${spot.y + (isGroundPigeon ? 0 : sinkY)}%`,
                width: pigeonW,
                height: pigeonH,
                marginLeft: -(pigeonW / 2),
                opacity: isLanded || (isFlyingAway && wasLanded) ? 1 : isArriving ? 1 : 0,
                transform: !isLanded && !isArriving && !isFlyingAway ? "translateY(-60px)" : undefined,
                transition: isLanded && !isArriving ? "opacity 0.1s, top 0.15s ease-out" : undefined,
                animation,
                "--fly-x": `${flyX}px`,
                "--fly-y": `${flyY}px`,
                zIndex,
                pointerEvents: "none",
              } as React.CSSProperties
            }
          >
            {/* Pigeon body */}
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "70%",
                bottom: 0,
                background: colors.body,
                borderRadius: "40% 45% 35% 40%",
                boxShadow:
                  "inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.2)",
              }}
            />
            {/* Head */}
            <div
              style={{
                position: "absolute",
                left: spot.facing === "right" ? "60%" : "10%",
                top: 0,
                width: "35%",
                height: "50%",
                background: colors.body,
                borderRadius: "50%",
                boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.15)",
              }}
            />
            {/* Eye */}
            <div
              style={{
                position: "absolute",
                left: spot.facing === "right" ? "72%" : "18%",
                top: "15%",
                width: 2,
                height: 2,
                background: "#1a1a1a",
                borderRadius: "50%",
              }}
            />
            {/* Beak */}
            <div
              style={{
                position: "absolute",
                left: spot.facing === "right" ? "88%" : "-2%",
                top: "25%",
                width: 0,
                height: 0,
                borderTop: "2px solid transparent",
                borderBottom: "2px solid transparent",
                ...(spot.facing === "right"
                  ? { borderLeft: `4px solid ${colors.beak}` }
                  : { borderRight: `4px solid ${colors.beak}` }),
              }}
            />
            {/* Wing */}
            <div
              style={{
                position: "absolute",
                left: spot.facing === "right" ? "15%" : "45%",
                top: "20%",
                width: "40%",
                height: "55%",
                background: colors.wing,
                borderRadius:
                  spot.facing === "right"
                    ? "50% 20% 40% 50%"
                    : "20% 50% 50% 40%",
                transformOrigin:
                  spot.facing === "right" ? "right center" : "left center",
                animation:
                  isLanded || isArriving
                    ? `pigeon-wing-flap 0.8s ease-in-out ${spot.wobbleDelay}s infinite`
                    : isFlyingAway && wasLanded
                      ? "pigeon-wing-flap 0.2s ease-in-out infinite"
                      : "none",
              }}
            />
            {/* Tail */}
            <div
              style={{
                position: "absolute",
                left: spot.facing === "right" ? "-5%" : "75%",
                bottom: "15%",
                width: "30%",
                height: "35%",
                background: colors.wing,
                borderRadius:
                  spot.facing === "right"
                    ? "5% 40% 10% 40%"
                    : "40% 5% 40% 10%",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
