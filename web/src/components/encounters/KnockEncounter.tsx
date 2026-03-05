"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { usePoEncounter } from "@/hooks/usePoEncounter";
import { checkIsMobile, tryVibrate } from "@/hooks/useDeviceCapabilities";
import SpeechBubble from "./SpeechBubble";

/* -----------------------------------------
   KnockEncounter (T3)
   Po knocks on the sidebar border. Two knocks,
   then a "psst." speech bubble appears.

   Provider phases used:
     entering  -> component runs the full knock+bubble sequence
     accepted  -> bubble shrinks, then clearEncounter()
     dismissed -> bubble fades, then clearEncounter()
     exiting   -> same as dismissed
   ----------------------------------------- */

// --- Layout constants ---
const SIDEBAR_WIDTH = 200; // matches .site-sidebar { width: 200px }
const RIPPLE_TOP_RATIO = 0.6; // knock point ~60% down sidebar height
const BUBBLE_GAP = 8;
const BUBBLE_LEFT = SIDEBAR_WIDTH + BUBBLE_GAP;

// --- Timing (ms) ---
const KNOCK_2_DELAY = 400;
const KNOCK_FLASH_DURATION = 150;
const RIPPLE_DURATION = 400;
const ENTER_TO_BUBBLE = 800; // time from first knock to bubble appearing
const BUBBLE_TIMEOUT = 5_000; // auto-dismiss after this
const EXIT_DURATION = 300;
const ACCEPT_DURATION = 200;

// --- Ripple ---
const RIPPLE_MAX_SIZE = 30;

// Internal encounter stage (within the "entering" provider phase)
type InternalStage = "knocking" | "bubble" | "exit-dismissed" | "exit-accepted";

interface RippleEntry {
  id: number;
}

export default function KnockEncounter() {
  const {
    activeEncounter,
    encounterPhase,
    acceptEncounter,
    dismissEncounter,
    clearEncounter,
  } = usePoEncounter();

  const bubbleRef = useRef<HTMLButtonElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [ripples, setRipples] = useState<RippleEntry[]>([]);
  const [borderFlash, setBorderFlash] = useState(false);
  const [stage, setStage] = useState<InternalStage>("knocking");
  const rippleIdRef = useRef(0);
  const reducedMotion = useRef(false);

  // --- Detect reduced-motion ---
  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  // --- Mobile check ---
  const isMobile = useCallback(() => checkIsMobile(), []);

  // --- Timer management ---
  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // --- Spawn ripple ring ---
  const spawnRipple = useCallback(() => {
    const id = ++rippleIdRef.current;
    setRipples((prev) => [...prev, { id }]);
    schedule(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, RIPPLE_DURATION + 50);
  }, [schedule]);

  // --- Flash sidebar border ---
  const flashBorder = useCallback(() => {
    setBorderFlash(true);
    schedule(() => setBorderFlash(false), KNOCK_FLASH_DURATION);
  }, [schedule]);

  // ===== ENTERING phase -- run the knock sequence, then show bubble =====
  useEffect(() => {
    if (activeEncounter !== "knock" || encounterPhase !== "entering") return;

    // Reset internal state
    setRipples([]);
    setStage("knocking");

    if (reducedMotion.current) {
      // Skip ripple/flash, go straight to bubble
      setStage("bubble");
      return;
    }

    // Knock 1 at 0ms — shake the screen + haptic
    flashBorder();
    spawnRipple();
    tryVibrate([50, 30, 80]);
    document.documentElement.classList.add("knock-shake");
    schedule(() => {
      document.documentElement.classList.remove("knock-shake");
    }, 200);

    // Knock 2 at 400ms — second shake + haptic
    schedule(() => {
      flashBorder();
      spawnRipple();
      tryVibrate([80, 20, 100]);
      document.documentElement.classList.add("knock-shake-2");
      schedule(() => {
        document.documentElement.classList.remove("knock-shake-2");
      }, 200);
    }, KNOCK_2_DELAY);

    // Show bubble after knock sequence
    schedule(() => {
      setStage("bubble");
    }, ENTER_TO_BUBBLE);

    return clearTimers;
  }, [activeEncounter, encounterPhase, flashBorder, spawnRipple, schedule, clearTimers]);

  // ===== BUBBLE stage -- focus + auto-dismiss timeout =====
  useEffect(() => {
    if (activeEncounter !== "knock" || stage !== "bubble") return;

    // Focus for keyboard access (slight delay for pop-in animation)
    schedule(() => {
      bubbleRef.current?.focus();
    }, 250);

    // Auto-dismiss after timeout
    schedule(() => {
      dismissEncounter();
    }, BUBBLE_TIMEOUT);

    return clearTimers;
  }, [activeEncounter, stage, dismissEncounter, schedule, clearTimers]);

  // ===== DISMISSED / EXITING phase (from provider) =====
  useEffect(() => {
    if (activeEncounter !== "knock") return;
    if (encounterPhase !== "dismissed" && encounterPhase !== "exiting") return;

    setStage("exit-dismissed");
    schedule(() => {
      clearEncounter();
    }, EXIT_DURATION);

    return clearTimers;
  }, [activeEncounter, encounterPhase, clearEncounter, schedule, clearTimers]);

  // ===== ACCEPTED phase (from provider) =====
  useEffect(() => {
    if (activeEncounter !== "knock" || encounterPhase !== "accepted") return;

    setStage("exit-accepted");
    schedule(() => {
      clearEncounter();
    }, ACCEPT_DURATION);

    return clearTimers;
  }, [activeEncounter, encounterPhase, clearEncounter, schedule, clearTimers]);

  // ===== Cleanup on unmount =====
  useEffect(() => clearTimers, [clearTimers]);

  // --- Bail if not this encounter ---
  if (activeEncounter !== "knock") return null;

  // --- Compute positions ---
  const mobile = isMobile();
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const rippleTop = vh * RIPPLE_TOP_RATIO;

  // Bubble: desktop = just outside sidebar right edge; mobile = above bottom nav
  const bubblePosition = mobile
    ? { x: vw / 2 - 30, y: vh - 70 }
    : { x: BUBBLE_LEFT, y: rippleTop - 10 };

  const pointerDir = mobile ? ("down" as const) : ("left" as const);

  // --- Determine if bubble should render ---
  const showBubble = stage === "bubble" || stage === "exit-dismissed" || stage === "exit-accepted";

  // --- Bubble wrapper animation styles ---
  const getBubbleWrapperStyle = (): React.CSSProperties => {
    switch (stage) {
      case "knocking":
        // Hidden before bubble appears
        return { transform: "scale(0)", opacity: 0 };

      case "bubble":
        // Pixel pop-in
        return {
          transform: "scale(1)",
          opacity: 1,
          transition: "transform 200ms steps(3), opacity 200ms steps(3)",
        };

      case "exit-dismissed":
        // Fade out
        return {
          opacity: 0,
          transition: `opacity ${EXIT_DURATION}ms ease-out`,
        };

      case "exit-accepted":
        // Shrink + fade
        return {
          transform: "scale(0.5)",
          opacity: 0,
          transition: `transform ${ACCEPT_DURATION}ms steps(2), opacity ${ACCEPT_DURATION}ms ease-out`,
        };
    }
  };

  return (
    <>
      {/* -- Knock ripple overlay (at sidebar right edge) -- */}
      {!reducedMotion.current && ripples.length > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: SIDEBAR_WIDTH,
            top: 0,
            width: 0,
            height: "100vh",
            zIndex: 45,
            pointerEvents: "none",
          }}
        >
          {ripples.map((ripple) => (
            <KnockRipple key={ripple.id} top={rippleTop} />
          ))}
        </div>
      )}

      {/* -- Sidebar border flash overlay -- */}
      {borderFlash && (
        <div
          aria-hidden="true"
          className="knock-border-flash"
          style={{
            position: "fixed",
            left: SIDEBAR_WIDTH - 1,
            top: 0,
            width: 2,
            height: "100vh",
            background: "#ffbf00",
            zIndex: 44,
            pointerEvents: "none",
            animation: `knock-border-flash ${KNOCK_FLASH_DURATION}ms ease-out forwards`,
          }}
        />
      )}

      {/* -- Speech bubble -- */}
      {showBubble && (
        <div style={getBubbleWrapperStyle()}>
          <SpeechBubble
            ref={bubbleRef}
            text="psst."
            position={bubblePosition}
            pointerDirection={pointerDir}
            onClick={acceptEncounter}
          />
        </div>
      )}
    </>
  );
}

/* --- Ripple ring sub-component --- */

function KnockRipple({ top }: { top: number }) {
  return (
    <div
      className="knock-ripple"
      style={{
        position: "absolute",
        left: -(RIPPLE_MAX_SIZE / 2),
        top: top - RIPPLE_MAX_SIZE / 2,
        width: 0,
        height: 0,
        borderRadius: "50%",
        border: "2px solid #ffbf00",
        animation: `knock-ripple-expand ${RIPPLE_DURATION}ms ease-out forwards`,
        pointerEvents: "none",
      }}
    />
  );
}
