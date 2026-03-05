"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePoEncounter } from "@/hooks/usePoEncounter";
import { checkIsMobile } from "@/hooks/useDeviceCapabilities";
import SpeechBubble from "./SpeechBubble";

const EYE_LEFT_X = 0.4;
const EYE_RIGHT_X = 0.6;
const EYE_Y = 0.35;
const MAX_OFFSET = 3;
const BUBBLE_DELAY_MS = 500;
const BUBBLE_LINGER_MS = 2000;
const AMBIENT_TIMEOUT_MS = 15_000;
const TILT_NEUTRAL_BETA = 45; // phone held at ~45deg = neutral
const TILT_RANGE = 15; // +-15deg maps to full eye range

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
  // Mobile tilt permission prompt
  const [showTiltPrompt, setShowTiltPrompt] = useState(false);
  const [tiltActive, setTiltActive] = useState(false);

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

  // --- Mount: detect reduced motion ---
  useEffect(() => {
    reducedMotion.current = prefersReducedMotion();
  }, []);

  // --- When encounter becomes active ---
  useEffect(() => {
    if (!active) return;

    // Try to find Po sprite — if not visible, silent exit
    if (!updateEyeBasePositions()) {
      clearEncounter();
      return;
    }

    const mobile = checkIsMobile();

    // Recalculate eye positions on scroll/resize
    const recalc = () => updateEyeBasePositions();
    window.addEventListener("scroll", recalc, { passive: true });
    window.addEventListener("resize", recalc, { passive: true });

    let motionCleanup: (() => void) | null = null;

    if (mobile) {
      // === MOBILE: Tilt tracking ===
      const needsPermission =
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof (DeviceOrientationEvent as any).requestPermission === "function";

      if (typeof DeviceOrientationEvent === "undefined") {
        // No orientation API — bail
        clearEncounter();
        return;
      }

      if (needsPermission) {
        // iOS: show tap-to-permit prompt (user gesture needed)
        setShowTiltPrompt(true);
      } else {
        // Android: orientation available without permission
        const onOrientation = (e: DeviceOrientationEvent) => {
          const beta = e.beta ?? 0;
          const gamma = e.gamma ?? 0;
          const normalizedX = Math.max(-1, Math.min(1, gamma / TILT_RANGE));
          const normalizedY = Math.max(-1, Math.min(1, (beta - TILT_NEUTRAL_BETA) / TILT_RANGE));
          mousePos.current = {
            x: (window.innerWidth / 2) + normalizedX * (window.innerWidth / 2),
            y: (window.innerHeight / 2) + normalizedY * (window.innerHeight / 2),
          };
        };
        window.addEventListener("deviceorientation", onOrientation);
        motionCleanup = () => window.removeEventListener("deviceorientation", onOrientation);
        setTiltActive(true);
      }
    } else {
      // === DESKTOP: Mouse tracking ===
      const onMouseMove = (e: MouseEvent) => {
        mousePos.current = { x: e.clientX, y: e.clientY };
      };
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      motionCleanup = () => window.removeEventListener("mousemove", onMouseMove);
    }

    // Ambient timeout — 15s without interaction → fade out
    ambientTimerRef.current = setTimeout(() => {
      setEyesFading(true);
      setTimeout(() => clearEncounter(), 500);
    }, AMBIENT_TIMEOUT_MS);

    return () => {
      window.removeEventListener("scroll", recalc);
      window.removeEventListener("resize", recalc);
      motionCleanup?.();
      if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current);
    };
  }, [active, clearEncounter, updateEyeBasePositions]);

  // --- iOS tap-to-permit: request DeviceOrientation permission ---
  const handleTiltPermit = useCallback(async () => {
    setShowTiltPrompt(false);
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission();
      if (result === "granted") {
        const onOrientation = (e: DeviceOrientationEvent) => {
          const beta = e.beta ?? 0;
          const gamma = e.gamma ?? 0;
          const normalizedX = Math.max(-1, Math.min(1, gamma / TILT_RANGE));
          const normalizedY = Math.max(-1, Math.min(1, (beta - TILT_NEUTRAL_BETA) / TILT_RANGE));
          mousePos.current = {
            x: (window.innerWidth / 2) + normalizedX * (window.innerWidth / 2),
            y: (window.innerHeight / 2) + normalizedY * (window.innerHeight / 2),
          };
        };
        window.addEventListener("deviceorientation", onOrientation);
        setTiltActive(true);
        // Reset ambient timeout since user engaged
        if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current);
        ambientTimerRef.current = setTimeout(() => {
          setEyesFading(true);
          setTimeout(() => clearEncounter(), 500);
        }, AMBIENT_TIMEOUT_MS);
      } else {
        clearEncounter();
      }
    } catch {
      clearEncounter();
    }
  }, [clearEncounter]);

  // --- Animation loop for eye tracking ---
  useEffect(() => {
    if (!active || !eyeBasePositions || reducedMotion.current) return;
    // On mobile, wait until tilt is active (or prompt is showing)
    const mobile = checkIsMobile();
    if (mobile && !tiltActive) return;

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
  }, [active, eyeBasePositions, tiltActive]);

  // --- Hover/tap detection on Po sprite area ---
  useEffect(() => {
    if (!active) return;

    const el = document.querySelector("[data-po-zone-sprite]");
    if (!el) return;
    const mobile = checkIsMobile();

    if (mobile) {
      // Tap to trigger bubble on mobile
      const onTap = () => {
        setHovering(true);
        setEyesBright(true);
        if (ambientTimerRef.current) {
          clearTimeout(ambientTimerRef.current);
          ambientTimerRef.current = null;
        }
        const delay = reducedMotion.current ? 0 : BUBBLE_DELAY_MS;
        hoverTimerRef.current = setTimeout(() => {
          setBubbleVisible(true);
        }, delay);
        // Auto-hide after linger
        lingerTimerRef.current = setTimeout(() => {
          setBubbleVisible(false);
          setHovering(false);
          setEyesBright(false);
          // Restart ambient timeout
          ambientTimerRef.current = setTimeout(() => {
            setEyesFading(true);
            setTimeout(() => clearEncounter(), 500);
          }, AMBIENT_TIMEOUT_MS);
        }, BUBBLE_DELAY_MS + BUBBLE_LINGER_MS);
      };
      el.addEventListener("click", onTap);
      return () => {
        el.removeEventListener("click", onTap);
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        if (lingerTimerRef.current) clearTimeout(lingerTimerRef.current);
      };
    }

    // Desktop hover detection
    const onEnter = () => {
      setHovering(true);
      setEyesBright(true);
      if (ambientTimerRef.current) {
        clearTimeout(ambientTimerRef.current);
        ambientTimerRef.current = null;
      }
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
      lingerTimerRef.current = setTimeout(() => {
        setBubbleVisible(false);
      }, BUBBLE_LINGER_MS);
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
      setShowTiltPrompt(false);
      setTiltActive(false);
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
  const mobile = checkIsMobile();

  return (
    <>
      {/* Tilt permission prompt (iOS mobile only) */}
      {showTiltPrompt && (
        <div
          className="cursor-stalk-tilt-prompt"
          style={{
            position: "fixed",
            bottom: 70,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 56,
          }}
        >
          <button
            onClick={handleTiltPermit}
            className="cursor-stalk-tilt-btn"
            aria-label="Allow Po to track your device tilt"
          >
            <span className="cursor-stalk-tilt-eyes" aria-hidden="true">
              &#x1F441; &#x1F441;
            </span>
            <span className="cursor-stalk-tilt-text">Po is watching... TAP</span>
          </button>
        </div>
      )}

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
          pointerDirection={mobile ? "down" : "left"}
          onClick={handleBubbleClick}
          position={
            mobile
              ? {
                  x: eyeBasePositions.lx - 30,
                  y: eyeBasePositions.ly - 50,
                }
              : {
                  x: eyeBasePositions.rx + 40,
                  y: eyeBasePositions.ly - 10,
                }
          }
        />
      )}
    </>
  );
}
