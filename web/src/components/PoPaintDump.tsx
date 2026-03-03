"use client";

import { useRef, useCallback, useEffect, useState } from "react";

/**
 * PoPaintDump — Paint bucket tips over Po's head (Gallery / Artist zone).
 *
 * Layers (all CSS, no sprite sheets):
 *   0. Background fill (purple, grows after first dump)
 *   1. Po body (static artist sprite)
 *   2. Purple sprite overlay (outfit goes purple after first dump)
 *   3. CSS beret (goes purple with outfit)
 *   4. CSS moustache (goes purple with outfit, spins + grows)
 *   5. CSS paintbrush (stays clean, spins each cycle)
 *   6. Paint bucket (tips over)
 *   7. Paint pour stream
 *   8. Paint splatters + drips (progressive)
 *   9. Splatter-out burst (when paint resets)
 *
 * Cycle: 3 dumps → splatter burst → clean reset → repeat
 */

// ─── Timing ────────────────────────────────────────────────────────────────────
const CYCLE_SEC = 4.5;
const SPLATTER_OUT_MS = 600; // burst animation duration

// ─── Beret layout (% of container) ──────────────────────────────────────────
const BERET_X = 32;
const BERET_Y = 14;
const BERET_W = 36;
const BERET_H = 10;

// ─── Moustache layout (% of container) ──────────────────────────────────────
const STACHE_X = 38;
const STACHE_Y = 40;
const STACHE_BASE = 24;
const STACHE_H = 8;

// ─── Paintbrush layout (% of container) ─────────────────────────────────────
const BRUSH_X = 62;
const BRUSH_Y = 38;
const BRUSH_W = 6;
const BRUSH_H = 40;

// ─── Bucket layout (% of container) ────────────────────────────────────────
const BUCKET_X = 55;
const BUCKET_Y = 2;
const BUCKET_W = 18;
const BUCKET_H = 14;

// ─── Paint pour ────────────────────────────────────────────────────────────
const POUR_X = 48;
const POUR_WIDTH = 8;

// ─── Progressive state ─────────────────────────────────────────────────────
const MAX_DUMPS = 3;
const STACHE_GROWTH = 0.15;

// ─── Gallery purple ────────────────────────────────────────────────────────
const PAINT_COLOR = "#9b59b6";
const PAINT_DARK = "#7d3c98";
const PAINT_LIGHT = "#c39bd3";

// ─── Sprite ────────────────────────────────────────────────────────────────
const SPRITE_PATH = "/sprites/po/costumes/artist_static.png";
const SPRITE_PURPLE_PATH = "/sprites/po/costumes/artist_static_purple.png";

// ─── Splatter burst particles ──────────────────────────────────────────────
const BURST_PARTICLES = [
  { angle: 0, dist: 90, size: 8 },
  { angle: 45, dist: 75, size: 6 },
  { angle: 90, dist: 85, size: 7 },
  { angle: 135, dist: 70, size: 5 },
  { angle: 180, dist: 80, size: 8 },
  { angle: 225, dist: 75, size: 6 },
  { angle: 270, dist: 65, size: 7 },
  { angle: 315, dist: 80, size: 5 },
  { angle: 20, dist: 95, size: 4 },
  { angle: 160, dist: 85, size: 4 },
  { angle: 200, dist: 70, size: 5 },
  { angle: 340, dist: 90, size: 4 },
];

interface PoPaintDumpProps {
  size?: number;
  className?: string;
}

export default function PoPaintDump({
  size = 128,
  className = "",
}: PoPaintDumpProps) {
  const bucketRef = useRef<HTMLDivElement>(null);
  const [dumpCount, setDumpCount] = useState(0);
  const [isBursting, setIsBursting] = useState(false);

  const handleIteration = useCallback(() => {
    setDumpCount((prev) => {
      if (prev >= MAX_DUMPS) {
        // Trigger splatter-out burst, then reset
        setIsBursting(true);
        setTimeout(() => {
          setIsBursting(false);
        }, SPLATTER_OUT_MS);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  useEffect(() => {
    const el = bucketRef.current;
    if (!el) return;
    el.addEventListener("animationiteration", handleIteration);
    return () => el.removeEventListener("animationiteration", handleIteration);
  }, [handleIteration]);

  const splatCount = Math.min(dumpCount, MAX_DUMPS);
  const stacheScale = 1 + dumpCount * STACHE_GROWTH;

  // After first dump: outfit (body + beret + moustache) goes full purple
  const isPurple = dumpCount >= 1 && !isBursting;
  const outfitOpacity = isPurple ? 1 : 0;

  // Background fill: starts after first dump, gets more opaque each cycle
  const BG_STEPS = [0, 0.25, 0.5, 0.75];
  const bgOpacity = isBursting ? 0 : BG_STEPS[Math.min(dumpCount, BG_STEPS.length - 1)];

  // Beret + moustache color: dark → purple after first dump
  const accessoryColor = isPurple ? PAINT_COLOR : "#1a1a1a";
  const accessoryColorDark = isPurple ? PAINT_DARK : "#2a2a2a";

  const spriteStyle = {
    backgroundImage: `url(${SPRITE_PATH})`,
    backgroundSize: `${size}px ${size}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated" as const,
  };

  const splatters = [
    { x: 42, y: 25, w: 8, h: 4 },
    { x: 55, y: 40, w: 6, h: 3 },
    { x: 35, y: 55, w: 10, h: 3 },
  ];

  return (
    <div
      className={`po-paint-dump ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        overflow: "visible",
      }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Layer 0: Background purple fill */}
      <div
        className="po-paint-bg"
        style={{
          position: "absolute",
          inset: 0,
          background: PAINT_COLOR,
          opacity: bgOpacity,
          transition: isBursting ? "opacity 0.3s ease-out" : "opacity 1s ease-in",
          zIndex: 0,
        }}
      />

      {/* Layer 1: Po body — only shakes during splatter burst */}
      <div
        className="po-paint-body"
        style={{
          position: "absolute",
          inset: 0,
          ...spriteStyle,
          transformOrigin: "bottom center",
          animation: isBursting ? `paint-shake-off 0.5s ease-in-out` : "none",
          zIndex: 1,
        }}
      />

      {/* Layer 2: Purple sprite overlay */}
      <div
        className="po-paint-tint"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${SPRITE_PURPLE_PATH})`,
          backgroundSize: `${size}px ${size}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated" as const,
          opacity: outfitOpacity,
          transition: isBursting ? "opacity 0.2s ease-out" : "opacity 0.8s ease-in",
          pointerEvents: "none",
          transformOrigin: "bottom center",
          animation: isBursting ? `paint-shake-off 0.5s ease-in-out` : "none",
          zIndex: 2,
        }}
      />

      {/* Layer 3: Beret */}
      <div
        className="po-paint-beret"
        style={{
          position: "absolute",
          left: `${BERET_X}%`,
          top: `${BERET_Y}%`,
          width: `${BERET_W}%`,
          height: `${BERET_H}%`,
          zIndex: 5,
          transformOrigin: "center bottom",
          animation: `beret-wobble ${CYCLE_SEC}s ease-in-out infinite`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: accessoryColor,
            borderRadius: "50% 50% 45% 55% / 60% 70% 30% 40%",
            transform: "rotate(-8deg)",
            position: "relative",
            transition: isBursting ? "background 0.2s ease-out" : "background 0.8s ease-in",
            boxShadow:
              "inset 1px 1px 0 rgba(255,255,255,0.15), inset -1px -1px 0 rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -2,
              left: "45%",
              width: 4,
              height: 4,
              background: accessoryColor,
              borderRadius: "50%",
              transition: isBursting ? "background 0.2s ease-out" : "background 0.8s ease-in",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: -1,
            left: "-5%",
            width: "110%",
            height: 3,
            background: accessoryColorDark,
            borderRadius: "50%",
            transition: isBursting ? "background 0.2s ease-out" : "background 0.8s ease-in",
          }}
        />
      </div>

      {/* Layer 4: Moustache */}
      <div
        className="po-paint-stache"
        style={
          {
            position: "absolute",
            left: `${STACHE_X}%`,
            top: `${STACHE_Y}%`,
            width: `${STACHE_BASE}%`,
            height: `${STACHE_H}%`,
            zIndex: 5,
            transformOrigin: "center center",
            "--stache-scale": stacheScale,
            animation: `stache-twirl ${CYCLE_SEC}s ease-in-out infinite`,
          } as React.CSSProperties
        }
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "45%",
            height: "100%",
            borderBottom: `3px solid ${accessoryColor}`,
            borderLeft: `2px solid ${accessoryColor}`,
            borderRadius: "0 0 0 70%",
            transition: isBursting ? "border-color 0.2s ease-out" : "border-color 0.8s ease-in",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "30%",
            top: 0,
            width: "40%",
            height: "50%",
            borderBottom: `3px solid ${accessoryColor}`,
            borderRadius: "0 0 50% 50%",
            transition: isBursting ? "border-color 0.2s ease-out" : "border-color 0.8s ease-in",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "45%",
            height: "100%",
            borderBottom: `3px solid ${accessoryColor}`,
            borderRight: `2px solid ${accessoryColor}`,
            borderRadius: "0 0 70% 0",
            transition: isBursting ? "border-color 0.2s ease-out" : "border-color 0.8s ease-in",
          }}
        />
      </div>

      {/* Layer 5: Paintbrush — stays clean */}
      <div
        className="po-paint-brush"
        style={{
          position: "absolute",
          left: `${BRUSH_X}%`,
          top: `${BRUSH_Y}%`,
          width: `${BRUSH_W}%`,
          height: `${BRUSH_H}%`,
          transformOrigin: "50% 30%",
          animation: `brush-spin ${CYCLE_SEC}s ease-in-out infinite`,
          zIndex: 5,
        }}
      >
        <div
          style={{
            width: "140%",
            height: "20%",
            background: `linear-gradient(to bottom, ${PAINT_COLOR}, ${PAINT_DARK})`,
            borderRadius: "3px 3px 1px 1px",
            marginLeft: "-20%",
          }}
        />
        <div
          style={{
            width: "120%",
            height: "6%",
            background: "#aaa",
            marginLeft: "-10%",
            borderRadius: 1,
          }}
        />
        <div
          style={{
            width: "100%",
            height: "74%",
            background: "linear-gradient(to right, #8B6914, #C49A2A, #8B6914)",
            borderRadius: "1px 1px 2px 2px",
          }}
        />
      </div>

      {/* Layer 6: Paint bucket */}
      <div
        ref={bucketRef}
        className="po-paint-bucket"
        style={{
          position: "absolute",
          left: `${BUCKET_X}%`,
          top: `${BUCKET_Y}%`,
          width: `${BUCKET_W}%`,
          height: `${BUCKET_H}%`,
          transformOrigin: "bottom left",
          animation: `paint-bucket-tip ${CYCLE_SEC}s ease-in-out infinite`,
          zIndex: 6,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(to bottom, #888, #666)`,
            borderRadius: "2px 2px 1px 1px",
            border: "1px solid #555",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 1,
              right: 1,
              height: "60%",
              background: PAINT_COLOR,
              borderRadius: "0 0 1px 1px",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: -1,
              right: -1,
              height: 2,
              background: "#999",
              borderRadius: 1,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: -3,
            left: "20%",
            right: "20%",
            height: 3,
            borderTop: "1.5px solid #aaa",
            borderLeft: "1.5px solid #aaa",
            borderRight: "1.5px solid #aaa",
            borderRadius: "3px 3px 0 0",
          }}
        />
      </div>

      {/* Layer 7: Paint pour stream */}
      <div
        className="po-paint-pour"
        style={{
          position: "absolute",
          left: `${POUR_X}%`,
          top: `${BUCKET_Y + BUCKET_H}%`,
          width: `${POUR_WIDTH}%`,
          bottom: "15%",
          background: `linear-gradient(to bottom, ${PAINT_COLOR}, ${PAINT_DARK}88)`,
          borderRadius: "0 0 2px 2px",
          animation: `paint-pour ${CYCLE_SEC}s ease-in-out infinite`,
          zIndex: 4,
        }}
      />

      {/* Layer 8: Paint splatters (progressive) */}
      {splatters.map((splat, i) => (
        <div
          key={i}
          className="po-paint-splat"
          style={{
            position: "absolute",
            left: `${splat.x}%`,
            top: `${splat.y}%`,
            width: `${splat.w}%`,
            height: `${splat.h}%`,
            background: i % 2 === 0 ? PAINT_COLOR : PAINT_LIGHT,
            borderRadius: "50%",
            opacity: i < splatCount ? 1 : 0,
            transition: "opacity 0.3s ease-in",
            animation: `paint-splat-drip ${CYCLE_SEC}s ease-in-out infinite`,
            animationDelay: `${i * 0.05}s`,
            zIndex: 7,
          }}
        />
      ))}

      {/* Paint drips from head */}
      <div
        className="po-paint-drips"
        style={{
          position: "absolute",
          left: "35%",
          top: "30%",
          width: "30%",
          height: "50%",
          pointerEvents: "none",
          animation: `paint-drips ${CYCLE_SEC}s ease-in-out infinite`,
          zIndex: 7,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${i * 35}%`,
              top: 0,
              width: 3,
              height: 8,
              background: PAINT_COLOR,
              borderRadius: "0 0 2px 2px",
              animation: `paint-drip-fall ${CYCLE_SEC}s ease-in infinite`,
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>

      {/* Layer 9: Splatter-out burst — paint flies off when resetting */}
      {isBursting && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {BURST_PARTICLES.map((p, i) => {
            const rad = (p.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * p.dist;
            const ty = Math.sin(rad) * p.dist;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "45%",
                  width: p.size,
                  height: p.size,
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                  background: i % 3 === 0 ? PAINT_COLOR : i % 3 === 1 ? PAINT_DARK : PAINT_LIGHT,
                  borderRadius: "50%",
                  animation: `splatter-burst ${SPLATTER_OUT_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                  // Each particle gets its own destination via CSS custom properties
                  ["--burst-x" as string]: `${tx}px`,
                  ["--burst-y" as string]: `${ty}px`,
                  animationDelay: `${i * 15}ms`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
