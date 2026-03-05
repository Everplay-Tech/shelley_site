"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePoEncounter } from "@/hooks/usePoEncounter";
import { checkIsMobile } from "@/hooks/useDeviceCapabilities";
import EncounterNote from "./EncounterNote";

// ─── PaperPlaneEncounter ────────────────────────────────────────────────────
// Phase-driven paper plane that flies in, lands, can be clicked to reveal
// an EncounterNote, and exits based on user choice or timeout.

// ─── Constants ──────────────────────────────────────────────────────────────
const SIDEBAR_WIDTH = 200;
const PLANE_WIDTH = 40;
const PLANE_HEIGHT = 25;
const FLIGHT_DURATION_MS = 1500;
const BOUNCE_DURATION_MS = 200;
const UNFOLD_DURATION_MS = 400;
const REFOLD_DURATION_MS = 400;
const FADE_DURATION_MS = 200;
const EXIT_FLIGHT_DURATION_MS = 800;
const DRIFT_DURATION_MS = 1500;
const WAITING_TIMEOUT_MS = 8000;
type InternalState =
  | "flying" // entering animation
  | "landed" // waiting for click
  | "unfolding" // plane unfolds to reveal note
  | "note" // note is visible
  | "refolding" // NO clicked — refold then exit
  | "exit-fly" // refolded, flying back to sidebar
  | "exit-drift" // timeout — drifting off right
  | "exit-fade" // accepted — quick fade
  | "done"; // cleared

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export default function PaperPlaneEncounter() {
  const {
    activeEncounter,
    encounterPhase,
    acceptEncounter,
    dismissEncounter,
    clearEncounter,
  } = usePoEncounter();

  const reducedMotion = usePrefersReducedMotion();

  // Internal animation state — independent from encounterPhase
  const [internalState, setInternalState] = useState<InternalState>("flying");
  // Track whether dismiss was by timeout (drift) or click (refold+fly)
  const dismissReason = useRef<"timeout" | "click" | null>(null);

  // Landing position — computed once on mount
  const landingPos = useMemo(() => {
    if (typeof window === "undefined") return { x: 400, y: 300 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = checkIsMobile();
    if (mobile) {
      return {
        x: randomBetween(vw * 0.15, vw * 0.65),
        y: randomBetween(vh * 0.25, vh * 0.55),
      };
    }
    return {
      x: randomBetween(vw * 0.4, vw * 0.7),
      y: randomBetween(vh * 0.3, vh * 0.7),
    };
  }, []);

  // Start position — left edge (desktop) or bottom (mobile)
  const startPos = useMemo(() => {
    if (typeof window === "undefined") return { x: SIDEBAR_WIDTH, y: 300 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = checkIsMobile();
    if (mobile) {
      return {
        x: randomBetween(vw * 0.2, vw * 0.6),
        y: vh + 30,
      };
    }
    return {
      x: SIDEBAR_WIDTH,
      y: randomBetween(vh * 0.3, vh * 0.6),
    };
  }, []);

  // Refs for timeout cleanup
  const waitingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear all timeouts helper
  const clearAllTimeouts = useCallback(() => {
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
  }, []);

  // ─── Reset when encounter becomes active ───────────────────────────
  useEffect(() => {
    if (activeEncounter === "paper_plane" && encounterPhase === "entering") {
      dismissReason.current = null;
      if (reducedMotion) {
        setInternalState("landed");
      } else {
        setInternalState("flying");
        animTimerRef.current = setTimeout(() => {
          setInternalState("landed");
        }, FLIGHT_DURATION_MS + BOUNCE_DURATION_MS);
      }
    }
  }, [activeEncounter, encounterPhase, reducedMotion]);

  // ─── Waiting timeout (8s auto-dismiss) ─────────────────────────────
  useEffect(() => {
    if (
      internalState === "landed" &&
      (encounterPhase === "waiting" || encounterPhase === "entering")
    ) {
      waitingTimeoutRef.current = setTimeout(() => {
        dismissReason.current = "timeout";
        dismissEncounter();
      }, WAITING_TIMEOUT_MS);
      return () => {
        if (waitingTimeoutRef.current) {
          clearTimeout(waitingTimeoutRef.current);
          waitingTimeoutRef.current = null;
        }
      };
    }
  }, [internalState, encounterPhase, dismissEncounter]);

  // ─── React to phase changes from provider ──────────────────────────
  useEffect(() => {
    if (activeEncounter !== "paper_plane") return;

    if (encounterPhase === "dismissed" || encounterPhase === "exiting") {
      clearAllTimeouts();
      if (internalState === "note" || internalState === "unfolding") {
        // NO was clicked on note — refold then fly back
        dismissReason.current = "click";
        setInternalState("refolding");
        animTimerRef.current = setTimeout(() => {
          setInternalState("exit-fly");
          animTimerRef.current = setTimeout(() => {
            setInternalState("done");
            clearEncounter();
          }, EXIT_FLIGHT_DURATION_MS);
        }, REFOLD_DURATION_MS);
      } else if (dismissReason.current === "timeout") {
        // Timeout — drift off right
        setInternalState("exit-drift");
        animTimerRef.current = setTimeout(() => {
          setInternalState("done");
          clearEncounter();
        }, DRIFT_DURATION_MS);
      } else {
        // Dismissed during landed/other state — just drift
        setInternalState("exit-drift");
        animTimerRef.current = setTimeout(() => {
          setInternalState("done");
          clearEncounter();
        }, DRIFT_DURATION_MS);
      }
    }

    if (encounterPhase === "accepted") {
      clearAllTimeouts();
      setInternalState("exit-fade");
      animTimerRef.current = setTimeout(() => {
        setInternalState("done");
        clearEncounter();
      }, FADE_DURATION_MS);
    }
  }, [encounterPhase, activeEncounter, clearEncounter, clearAllTimeouts, internalState]);

  // ─── Cleanup on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  // ─── Plane click → unfold to note ─────────────────────────────────
  const handlePlaneClick = useCallback(() => {
    if (internalState !== "landed") return;
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }
    setInternalState("unfolding");
    animTimerRef.current = setTimeout(() => {
      setInternalState("note");
    }, UNFOLD_DURATION_MS);
  }, [internalState]);

  const handlePlaneKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePlaneClick();
      }
    },
    [handlePlaneClick],
  );

  // ─── Note callbacks ────────────────────────────────────────────────
  const handleNoteAccept = useCallback(() => {
    acceptEncounter();
  }, [acceptEncounter]);

  const handleNoteDismiss = useCallback(() => {
    dismissReason.current = "click";
    dismissEncounter();
  }, [dismissEncounter]);

  // ─── Don't render conditions ───────────────────────────────────────
  if (activeEncounter !== "paper_plane") return null;
  if (internalState === "done") return null;

  // ─── Compute transform + style for current state ───────────────────
  const planeStyle = computePlaneStyle(
    internalState,
    startPos,
    landingPos,
    reducedMotion,
  );

  const showNote = internalState === "note";
  const showPlane =
    internalState !== "note" &&
    internalState !== "exit-fade";

  return (
    <div
      className="paper-plane-encounter"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 55,
        pointerEvents: "none",
      }}
      aria-live="polite"
    >
      {/* Paper plane element */}
      {showPlane && (
        <div
          role="button"
          tabIndex={internalState === "landed" ? 0 : -1}
          aria-label="A paper plane has landed. Click to open."
          onClick={handlePlaneClick}
          onKeyDown={handlePlaneKeyDown}
          className="paper-plane-body"
          style={{
            position: "absolute",
            width: PLANE_WIDTH,
            height: PLANE_HEIGHT,
            pointerEvents: internalState === "landed" ? "auto" : "none",
            cursor: internalState === "landed" ? "pointer" : "default",
            outline: "none",
            ...planeStyle,
          }}
        >
          <PaperPlaneShape hoverable={internalState === "landed"} />
        </div>
      )}

      {/* Fading plane+note for accepted state */}
      {internalState === "exit-fade" && (
        <div
          className="paper-plane-fade-out"
          style={{
            position: "absolute",
            left: landingPos.x,
            top: landingPos.y,
            pointerEvents: "none",
          }}
        >
          <PaperPlaneShape hoverable={false} />
        </div>
      )}

      {/* EncounterNote */}
      {showNote && (
        <EncounterNote
          position={{
            x: landingPos.x - 80,
            y: landingPos.y - 40,
          }}
          onAccept={handleNoteAccept}
          onDismiss={handleNoteDismiss}
        />
      )}
    </div>
  );
}

// ─── Plane style computation per state ──────────────────────────────────────
function computePlaneStyle(
  state: InternalState,
  startPos: { x: number; y: number },
  landingPos: { x: number; y: number },
  reducedMotion: boolean,
): React.CSSProperties {
  switch (state) {
    case "flying":
      return {
        left: startPos.x,
        top: startPos.y,
        animation: reducedMotion
          ? "none"
          : `paper-plane-flight ${FLIGHT_DURATION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards`,
        "--pp-end-x": `${landingPos.x - startPos.x}px`,
        "--pp-end-y": `${landingPos.y - startPos.y}px`,
        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.2))",
      } as React.CSSProperties;

    case "landed":
      return {
        left: landingPos.x,
        top: landingPos.y,
        transform: "rotate(0deg)",
        transition: "transform 200ms ease",
        filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.1))",
      };

    case "unfolding":
      return {
        left: landingPos.x,
        top: landingPos.y,
        animation: `paper-plane-unfold ${UNFOLD_DURATION_MS}ms ease-in-out forwards`,
        transformOrigin: "center center",
      };

    case "refolding":
      return {
        left: landingPos.x,
        top: landingPos.y,
        animation: `paper-plane-refold ${REFOLD_DURATION_MS}ms ease-in-out forwards`,
        transformOrigin: "center center",
      };

    case "exit-fly":
      return {
        left: landingPos.x,
        top: landingPos.y,
        animation: `paper-plane-exit-fly ${EXIT_FLIGHT_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
        "--pp-return-x": `${startPos.x - landingPos.x}px`,
        "--pp-return-y": `${startPos.y - landingPos.y}px`,
        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.2))",
      } as React.CSSProperties;

    case "exit-drift":
      return {
        left: landingPos.x,
        top: landingPos.y,
        animation: `paper-plane-drift ${DRIFT_DURATION_MS}ms ease-in forwards`,
      };

    case "exit-fade":
      return {
        left: landingPos.x,
        top: landingPos.y,
      };

    default:
      return {
        left: landingPos.x,
        top: landingPos.y,
      };
  }
}

// ─── Pure CSS Paper Plane Shape ─────────────────────────────────────────────
function PaperPlaneShape({ hoverable }: { hoverable: boolean }) {
  return (
    <div
      className={`paper-plane-visual ${hoverable ? "paper-plane-hoverable" : ""}`}
      style={{
        position: "relative",
        width: PLANE_WIDTH,
        height: PLANE_HEIGHT,
        transition: hoverable ? "transform 200ms ease" : undefined,
      }}
      aria-hidden="true"
    >
      {/* Upper wing — larger triangle */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          borderLeft: `${PLANE_WIDTH}px solid #f8f8f0`,
          borderTop: `${Math.round(PLANE_HEIGHT * 0.48)}px solid transparent`,
          borderBottom: `${Math.round(PLANE_HEIGHT * 0.12)}px solid transparent`,
          filter: "brightness(1.02)",
        }}
      />
      {/* Lower wing — smaller triangle */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: 0,
          height: 0,
          borderLeft: `${PLANE_WIDTH}px solid #eeeee4`,
          borderTop: `${Math.round(PLANE_HEIGHT * 0.08)}px solid transparent`,
          borderBottom: `${Math.round(PLANE_HEIGHT * 0.32)}px solid transparent`,
        }}
      />
      {/* Fold line — diagonal crease */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "48%",
          width: "100%",
          height: 1,
          background: "rgba(0, 0, 0, 0.08)",
          transform: "rotate(-2deg)",
          transformOrigin: "left center",
        }}
      />
      {/* Nose highlight */}
      <div
        style={{
          position: "absolute",
          right: -1,
          top: "38%",
          width: 3,
          height: 3,
          background: "rgba(255, 255, 255, 0.4)",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
