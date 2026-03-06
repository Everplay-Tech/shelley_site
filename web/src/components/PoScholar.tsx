"use client";

import { useRef, useCallback, useEffect, useState } from "react";

/**
 * PoScholar — Speed reader animation (Account / Scholar zone).
 *
 * Layers (all CSS, no sprite sheets):
 *   0. Po body (static scholar sprite — glasses + book baked in)
 *   1. Page particles — oblong triangles that sweep from book front
 *      to back, suggesting rapid page flipping
 *   2. Glasses glint (white flash on lenses, timed to cycle)
 *   3. Flight suitcase (CSS prop, books peeking out)
 *   4. Floating book stack (subtle bob beside suitcase)
 *   5. Page burst (pages explode outward on reset after N cycles)
 *
 * Cycle: 4 speed-read cycles → page burst → clean reset → repeat
 */

// ─── Timing ────────────────────────────────────────────────────────────────────
const CYCLE_SEC = 3;
const BURST_MS = 600;

// ─── Suitcase layout (% of container) ──────────────────────────────────────
const CASE_X = 62;
const CASE_Y = 50;
const CASE_W = 30;
const CASE_H = 42;

// ─── Book stack layout ─────────────────────────────────────────────────────
const STACK_X = 66;
const STACK_Y = 42;

// ─── Glasses glint layout ──────────────────────────────────────────────────
const GLINT_L_X = 36;
const GLINT_R_X = 48;
const GLINT_Y = 28;
const GLINT_SIZE = 8;

// ─── Progressive state ─────────────────────────────────────────────────────
const MAX_CYCLES = 4;

// ─── Colors ────────────────────────────────────────────────────────────────
const PAGE_COLOR = "#f5f0e8";
const PAGE_DARK = "#d4c9b8";
const BOOK_SPINE = "#4a90d9";
const CASE_COLOR = "#8B6914";
const CASE_DARK = "#6B4F10";
const CASE_HANDLE = "#555";

// ─── Sprite ────────────────────────────────────────────────────────────────
const SPRITE_PATH = "/sprites/po/costumes/scholar_static.png";

// ─── Page sweep particles ──────────────────────────────────────────────────
// Oblong triangles that arc from the book's right side (front) toward the left (back)
// Each has: startX/Y (% origin near book), arcHeight, delay, size
const PAGE_PARTICLES = [
  { delay: 0, w: 12, h: 5, arcY: -18, drift: -22 },
  { delay: 0.4, w: 10, h: 4, arcY: -24, drift: -18 },
  { delay: 0.8, w: 14, h: 5, arcY: -14, drift: -26 },
  { delay: 1.2, w: 9, h: 4, arcY: -20, drift: -20 },
  { delay: 1.6, w: 11, h: 5, arcY: -22, drift: -24 },
  { delay: 2.0, w: 10, h: 4, arcY: -16, drift: -19 },
];

// ─── Page burst particles ──────────────────────────────────────────────────
const BURST_PAGES = [
  { angle: -30, dist: 80, w: 10, h: 7, rot: 25 },
  { angle: -60, dist: 70, w: 8, h: 6, rot: -15 },
  { angle: -90, dist: 85, w: 9, h: 7, rot: 40 },
  { angle: -120, dist: 75, w: 7, h: 5, rot: -30 },
  { angle: -150, dist: 65, w: 10, h: 6, rot: 10 },
  { angle: 0, dist: 90, w: 8, h: 6, rot: -20 },
  { angle: 30, dist: 70, w: 9, h: 7, rot: 35 },
  { angle: 60, dist: 80, w: 7, h: 5, rot: -45 },
  { angle: -45, dist: 95, w: 6, h: 4, rot: 15 },
  { angle: -135, dist: 85, w: 6, h: 4, rot: -10 },
];

interface PoScholarProps {
  size?: number;
  className?: string;
}

export default function PoScholar({
  size = 128,
  className = "",
}: PoScholarProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [cycleCount, setCycleCount] = useState(0);
  const [isBursting, setIsBursting] = useState(false);

  const handleIteration = useCallback(() => {
    setCycleCount((prev) => {
      if (prev >= MAX_CYCLES) {
        setIsBursting(true);
        setTimeout(() => {
          setIsBursting(false);
        }, BURST_MS);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    el.addEventListener("animationiteration", handleIteration);
    return () => el.removeEventListener("animationiteration", handleIteration);
  }, [handleIteration]);

  // Pages fly faster each cycle: 3s → 2.55 → 2.1 → 1.65 → 1.2
  const flipSpeed = CYCLE_SEC * (1 - cycleCount * 0.15);
  const glintIntensity = Math.min(0.3 + cycleCount * 0.18, 1);

  const spriteStyle = {
    backgroundImage: `url(${SPRITE_PATH})`,
    backgroundSize: `${size}px ${size}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated" as const,
  };

  return (
    <div
      className={`po-scholar ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        overflow: "visible",
      }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Layer 0: Po body — shakes during burst only */}
      <div
        className="po-scholar-body"
        style={{
          position: "absolute",
          inset: 0,
          ...spriteStyle,
          transformOrigin: "bottom center",
          animation: isBursting
            ? `scholar-recoil ${BURST_MS}ms ease-in-out`
            : "none",
          zIndex: 1,
        }}
      />

      {/* Layer 1: Page sweep particles — oblong triangles arcing from book */}
      {!isBursting &&
        PAGE_PARTICLES.map((p, i) => (
          <div
            ref={i === 0 ? pageRef : undefined}
            key={i}
            className="po-scholar-page"
            style={
              {
                position: "absolute",
                left: "42%",
                top: "52%",
                width: p.w,
                height: p.h,
                background: i % 2 === 0 ? PAGE_COLOR : PAGE_DARK,
                clipPath: "polygon(0% 0%, 100% 30%, 85% 100%, 0% 80%)",
                animationName: "scholar-page-sweep",
                animationDuration: `${flipSpeed}s`,
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                animationDelay: `${p.delay * (flipSpeed / CYCLE_SEC)}s`,
                "--sweep-arc": `${p.arcY}px`,
                "--sweep-drift": `${p.drift}px`,
                zIndex: 4,
                pointerEvents: "none",
              } as React.CSSProperties
            }
          />
        ))}

      {/* Layer 2: Glasses glint */}
      <div
        className="po-scholar-glint-l"
        style={{
          position: "absolute",
          left: `${GLINT_L_X}%`,
          top: `${GLINT_Y}%`,
          width: GLINT_SIZE,
          height: GLINT_SIZE,
          background: `radial-gradient(circle, rgba(255,255,255,${glintIntensity}) 0%, transparent 70%)`,
          borderRadius: "50%",
          animation: `scholar-glint ${CYCLE_SEC}s ease-in-out infinite`,
          pointerEvents: "none",
          zIndex: 5,
        }}
      />
      <div
        className="po-scholar-glint-r"
        style={{
          position: "absolute",
          left: `${GLINT_R_X}%`,
          top: `${GLINT_Y}%`,
          width: GLINT_SIZE,
          height: GLINT_SIZE,
          background: `radial-gradient(circle, rgba(255,255,255,${glintIntensity}) 0%, transparent 70%)`,
          borderRadius: "50%",
          animationName: "scholar-glint",
          animationDuration: `${CYCLE_SEC}s`,
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDelay: "0.1s",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Layer 3: Flight suitcase */}
      <div
        className="po-scholar-suitcase"
        style={{
          position: "absolute",
          left: `${CASE_X}%`,
          top: `${CASE_Y}%`,
          width: `${CASE_W}%`,
          height: `${CASE_H}%`,
          zIndex: 0,
        }}
      >
        {/* Pull handle */}
        <div
          style={{
            position: "absolute",
            left: "40%",
            top: -8,
            width: 3,
            height: 10,
            background: CASE_HANDLE,
            borderRadius: "2px 2px 0 0",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "30%",
            top: -10,
            width: "40%",
            height: 3,
            background: CASE_HANDLE,
            borderRadius: 2,
          }}
        />
        {/* Case body */}
        <div
          style={{
            width: "100%",
            height: "75%",
            background: `linear-gradient(135deg, ${CASE_COLOR}, ${CASE_DARK})`,
            borderRadius: "3px",
            border: "1px solid #5a4010",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Case stripe */}
          <div
            style={{
              position: "absolute",
              top: "45%",
              left: 0,
              right: 0,
              height: 2,
              background: "#5a4010",
            }}
          />
          {/* Books peeking out top */}
          <div
            style={{
              position: "absolute",
              top: -3,
              left: "10%",
              width: "25%",
              height: 6,
              background: BOOK_SPINE,
              borderRadius: "1px 1px 0 0",
              transform: "rotate(-5deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -2,
              left: "40%",
              width: "20%",
              height: 5,
              background: "#c0392b",
              borderRadius: "1px 1px 0 0",
              transform: "rotate(3deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -4,
              right: "15%",
              width: "22%",
              height: 7,
              background: "#27ae60",
              borderRadius: "1px 1px 0 0",
              transform: "rotate(-2deg)",
            }}
          />
        </div>
        {/* Wheels */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "15%",
            width: 5,
            height: 5,
            background: "#333",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: "15%",
            width: 5,
            height: 5,
            background: "#333",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Layer 4: Floating book stack */}
      <div
        className="po-scholar-stack"
        style={{
          position: "absolute",
          left: `${STACK_X}%`,
          top: `${STACK_Y}%`,
          zIndex: 0,
          animation: `scholar-stack-bob 3s ease-in-out infinite`,
        }}
      >
        {[
          { color: "#e74c3c", w: 14, h: 4, rot: -2 },
          { color: "#2ecc71", w: 12, h: 4, rot: 1 },
          { color: BOOK_SPINE, w: 13, h: 4, rot: -1 },
        ].map((book, i) => (
          <div
            key={i}
            style={{
              width: book.w,
              height: book.h,
              background: book.color,
              borderRadius: 1,
              transform: `rotate(${book.rot}deg)`,
              marginBottom: -1,
              boxShadow: "0 1px 0 rgba(0,0,0,0.3)",
            }}
          />
        ))}
      </div>

      {/* Layer 5: Page burst — pages explode outward on reset */}
      {isBursting && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {BURST_PAGES.map((p, i) => {
            const rad = (p.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * p.dist;
            const ty = Math.sin(rad) * p.dist;
            return (
              <div
                key={i}
                style={
                  {
                    position: "absolute",
                    left: "42%",
                    top: "50%",
                    width: p.w,
                    height: p.h,
                    background: i % 2 === 0 ? PAGE_COLOR : PAGE_DARK,
                    clipPath: "polygon(0% 0%, 100% 30%, 85% 100%, 0% 80%)",
                    animation: `scholar-page-burst ${BURST_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                    "--burst-x": `${tx}px`,
                    "--burst-y": `${ty}px`,
                    "--burst-rot": `${p.rot}deg`,
                    animationDelay: `${i * 20}ms`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
