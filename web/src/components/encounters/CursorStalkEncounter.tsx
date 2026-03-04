"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePoEncounter } from "@/hooks/usePoEncounter";
import SpeechBubble from "./SpeechBubble";

const EYE_LEFT_X = 0.4;
const EYE_RIGHT_X = 0.6;
const EYE_Y = 0.35;
const MAX_OFFSET = 3;
const BUBBLE_DELAY_MS = 500;
const BUBBLE_LINGER_MS = 2000;
const AMBIENT_TIMEOUT_MS = 15_000;

function isMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth <= 768;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function CursorStalkEncounter() {
  const { activeEncounter, encounterPhase, acceptEncounter, clearEncounter } =
    usePoEncounter();

  const [eyeOffsets, setEyeOffsets] = useState({ lx: 0, ly: 0, rx: 0, ry: 0 });
  const [eyeBasePositions, setEyeBasePositions] = useState<{
    lx: number;
    ly: number;
    rx: number;
    ry: number;
  } | null>(null);
  const [hovering, setHovering] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [eyesBright, setEyesBright] = useState(false);
  const [eyesFading, setEyesFading] = useState(false);
  const [eyesPulse, setEyesPulse] = useState(false);

  const mousePos = useRef({ x: 0, y: 0 });
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ambientTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const reducedMotion = useRef(false);

  const active = activeEncounter === "cursor_stalk";

  // --- Locate the Po sprite container ---
  const updateEyeBasePositions = useCallback(() => {
    const el = document.querySelector("[data-po-zone-sprite]");
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    setEyeBasePositions({
      lx: rect.left + rect.width * EYE_LEFT_X,
      ly: rect.top + rect.height * EYE_Y,
      rx: rect.left + rect.width * EYE_RIGHT_X,
      ry: rect.top + rect.height * EYE_Y,
    });
    return true;
  }, []);

  // --- Mount: detect reduced motion, mobile ---
  useEffect(() => {
    reducedMotion.current = prefersReducedMotion();
  }, []);

  // --- When encounter becomes active ---
  useEffect(() => {
    if (!active) return;
    if (isMobile()) {
      clearEncounter();
      return;
    }

    // Try to find Po sprite — if not visible, silent exit
    if (!updateEyeBasePositions()) {
      clearEncounter();
      return;
    }

    // Recalculate eye positions on scroll/resize
    const recalc = () => updateEyeBasePositions();
    window.addEventListener("scroll", recalc, { passive: true });
    window.addEventListener("resize", recalc, { passive: true });

    // Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Ambient timeout — 15s without hover → fade out
    ambientTimerRef.current = setTimeout(() => {
      setEyesFading(true);
      setTimeout(() => clearEncounter(), 500);
    }, AMBIENT_TIMEOUT_MS);

    return () => {
      window.removeEventListener("scroll", recalc);
      window.removeEventListener("resize", recalc);
      window.removeEventListener("mousemove", onMouseMove);
      if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current);
    };
  }, [active, clearEncounter, updateEyeBasePositions]);

  // --- Animation loop for eye tracking ---
  useEffect(() => {
    if (!active || !eyeBasePositions || reducedMotion.current) return;

    const animate = () => {
      const { x, y } = mousePos.current;
      const calcOffset = (bx: number, by: number) => {
        const dx = x - bx;
        const dy = y - by;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { ox: 0, oy: 0 };
        const scale = Math.min(MAX_OFFSET / dist, 1);
        return { ox: dx * scale, oy: dy * scale };
      };

      const left = calcOffset(eyeBasePositions.lx, eyeBasePositions.ly);
      const right = calcOffset(eyeBasePositions.rx, eyeBasePositions.ry);
      setEyeOffsets({
        lx: left.ox,
        ly: left.oy,
        rx: right.ox,
        ry: right.oy,
      });
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, eyeBasePositions]);

  // --- Hover detection on Po sprite area ---
  useEffect(() => {
    if (!active) return;

    const el = document.querySelector("[data-po-zone-sprite]");
    if (!el) return;

    const onEnter = () => {
      setHovering(true);
      setEyesBright(true);

      // Reset ambient timeout on hover
      if (ambientTimerRef.current) {
        clearTimeout(ambientTimerRef.current);
        ambientTimerRef.current = null;
      }

      // Show bubble after delay (or immediately for reduced motion)
      const delay = reducedMotion.current ? 0 : BUBBLE_DELAY_MS;
      hoverTimerRef.current = setTimeout(() => {
        setBubbleVisible(true);
      }, delay);
    };

    const onLeave = () => {
      setHovering(false);
      setEyesBright(false);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }

      // Linger the bubble for 2s then hide
      lingerTimerRef.current = setTimeout(() => {
        setBubbleVisible(false);
      }, BUBBLE_LINGER_MS);

      // Restart ambient timeout
      ambientTimerRef.current = setTimeout(() => {
        setEyesFading(true);
        setTimeout(() => clearEncounter(), 500);
      }, AMBIENT_TIMEOUT_MS);
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (lingerTimerRef.current) clearTimeout(lingerTimerRef.current);
    };
  }, [active, clearEncounter]);

  // --- Phase: accepted → pulse then clear ---
  useEffect(() => {
    if (encounterPhase !== "accepted" || !active) return;
    setEyesPulse(true);
    setBubbleVisible(false);
    const t = setTimeout(() => {
      clearEncounter();
    }, 500);
    return () => clearTimeout(t);
  }, [encounterPhase, active, clearEncounter]);

  // --- Cleanup all state on deactivate ---
  useEffect(() => {
    if (!active) {
      setEyeOffsets({ lx: 0, ly: 0, rx: 0, ry: 0 });
      setEyeBasePositions(null);
      setHovering(false);
      setBubbleVisible(false);
      setEyesBright(false);
      setEyesFading(false);
      setEyesPulse(false);
    }
  }, [active]);

  // --- Bubble click → accept ---
  const handleBubbleClick = useCallback(() => {
    acceptEncounter();
  }, [acceptEncounter]);

  // --- Render nothing if not active or no positions ---
  if (!active || !eyeBasePositions) return null;

  const eyeClassName = [
    "cursor-stalk-eye",
    eyesBright && "cursor-stalk-eye--bright",
    eyesPulse && "cursor-stalk-eye--pulse",
  ]
    .filter(Boolean)
    .join(" ");

  const opacity = eyesFading ? 0 : 1;

  return (
    <>
      {/* Left eye */}
      <div
        className={eyeClassName}
        style={{
          left: eyeBasePositions.lx - 1.5,
          top: eyeBasePositions.ly - 1.5,
          opacity,
          transform: `translate(${eyeOffsets.lx}px, ${eyeOffsets.ly}px)`,
        }}
        aria-hidden="true"
      />
      {/* Right eye */}
      <div
        className={eyeClassName}
        style={{
          left: eyeBasePositions.rx - 1.5,
          top: eyeBasePositions.ry - 1.5,
          opacity,
          transform: `translate(${eyeOffsets.rx}px, ${eyeOffsets.ry}px)`,
        }}
        aria-hidden="true"
      />
      {/* Speech bubble */}
      {bubbleVisible && (
        <SpeechBubble
          text="...you can see me?"
          pointer="left"
          visible={bubbleVisible}
          onClick={handleBubbleClick}
          style={{
            position: "fixed",
            left: eyeBasePositions.rx + 40,
            top: eyeBasePositions.ly - 10,
          }}
        />
      )}
    </>
  );
}
