"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePoEncounter } from "@/hooks/usePoEncounter";
import { useZoneSidebar } from "@/components/ZoneSidebarContext";
import EncounterNote from "./EncounterNote";

// ─── ZoneDropEncounter ─────────────────────────────────────────────────────
// Zone-specific projectile objects. Each zone has a themed messenger object
// that Po sends. Same interaction pattern as PaperPlane (land → click → note).

// ─── Constants ──────────────────────────────────────────────────────────────
const SIDEBAR_WIDTH = 200;
const FLIGHT_DURATION_MS = 1200;
const BOUNCE_DURATION_MS = 200;
const UNFOLD_DURATION_MS = 400;
const REFOLD_DURATION_MS = 400;
const FADE_DURATION_MS = 200;
const EXIT_DURATION_MS = 800;
const DRIFT_DURATION_MS = 1500;
const WAITING_TIMEOUT_MS = 8000;
const MOBILE_BREAKPOINT = 768;

type ZoneObjectType = "pick" | "splat" | "page" | "pigeon";

type InternalState =
  | "entering"
  | "landed"
  | "unfolding"
  | "note"
  | "refolding"
  | "exit-fly"
  | "exit-drift"
  | "exit-fade"
  | "done";

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

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(window.innerWidth <= MOBILE_BREAKPOINT);
  }, []);
  return mobile;
}

// Map zone IDs to object types
function getObjectType(zoneId: string | undefined | null): ZoneObjectType {
  switch (zoneId) {
    case "workshop":
      return "pick";
    case "gallery":
      return "splat";
    case "librarynth":
      return "page";
    case "contact":
      return "pigeon";
    default:
      return "pick";
  }
}

export default function ZoneDropEncounter() {
  const {
    activeEncounter,
    encounterPhase,
    acceptEncounter,
    dismissEncounter,
    clearEncounter,
  } = usePoEncounter();

  const zone = useZoneSidebar();
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  const objectType = getObjectType(zone?.id);

  const [internalState, setInternalState] = useState<InternalState>("entering");
  const dismissReason = useRef<"timeout" | "click" | null>(null);

  // Landing position
  const landingPos = useMemo(() => {
    if (typeof window === "undefined") return { x: 400, y: 300 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      x: randomBetween(vw * 0.4, vw * 0.7),
      y: randomBetween(vh * 0.3, vh * 0.7),
    };
  }, []);

  // Start position varies by object type
  const startPos = useMemo(() => {
    if (typeof window === "undefined") return { x: SIDEBAR_WIDTH, y: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    switch (objectType) {
      case "pick":
        // Flicked from left
        return { x: SIDEBAR_WIDTH, y: randomBetween(vh * 0.3, vh * 0.6) };
      case "splat":
        // Drops from above
        return { x: landingPos.x, y: -50 };
      case "page":
        // Floats from top with sway
        return { x: randomBetween(vw * 0.3, vw * 0.6), y: -60 };
      case "pigeon":
        // Flies from left at downward angle
        return { x: SIDEBAR_WIDTH - 40, y: randomBetween(vh * 0.15, vh * 0.3) };
      default:
        return { x: SIDEBAR_WIDTH, y: randomBetween(vh * 0.3, vh * 0.6) };
    }
  }, [objectType, landingPos.x]);

  // Refs for timeout cleanup
  const waitingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ─── Reset when encounter becomes active ─────────────────────────
  useEffect(() => {
    if (activeEncounter === "zone_drop" && encounterPhase === "entering") {
      dismissReason.current = null;
      if (reducedMotion) {
        setInternalState("landed");
      } else {
        setInternalState("entering");
        animTimerRef.current = setTimeout(() => {
          setInternalState("landed");
        }, FLIGHT_DURATION_MS + BOUNCE_DURATION_MS);
      }
    }
  }, [activeEncounter, encounterPhase, reducedMotion]);

  // ─── Waiting timeout (8s auto-dismiss) ───────────────────────────
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

  // ─── React to phase changes from provider ────────────────────────
  useEffect(() => {
    if (activeEncounter !== "zone_drop") return;

    if (encounterPhase === "dismissed" || encounterPhase === "exiting") {
      clearAllTimeouts();
      if (internalState === "note" || internalState === "unfolding") {
        dismissReason.current = "click";
        setInternalState("refolding");
        animTimerRef.current = setTimeout(() => {
          setInternalState("exit-fly");
          animTimerRef.current = setTimeout(() => {
            setInternalState("done");
            clearEncounter();
          }, EXIT_DURATION_MS);
        }, REFOLD_DURATION_MS);
      } else if (dismissReason.current === "timeout") {
        setInternalState("exit-drift");
        animTimerRef.current = setTimeout(() => {
          setInternalState("done");
          clearEncounter();
        }, DRIFT_DURATION_MS);
      } else {
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

  // ─── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  // ─── Object click → unfold to note ───────────────────────────────
  const handleObjectClick = useCallback(() => {
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleObjectClick();
      }
    },
    [handleObjectClick],
  );

  // ─── Note callbacks ──────────────────────────────────────────────
  const handleNoteAccept = useCallback(() => {
    acceptEncounter();
  }, [acceptEncounter]);

  const handleNoteDismiss = useCallback(() => {
    dismissReason.current = "click";
    dismissEncounter();
  }, [dismissEncounter]);

  // ─── Don't render conditions ─────────────────────────────────────
  if (isMobile) return null;
  if (activeEncounter !== "zone_drop") return null;
  if (internalState === "done") return null;

  // ─── Compute transform + style for current state ─────────────────
  const objectStyle = computeObjectStyle(
    internalState,
    objectType,
    startPos,
    landingPos,
    reducedMotion,
  );

  const showNote = internalState === "note";
  const showObject = internalState !== "note" && internalState !== "exit-fade";

  const objectLabel = {
    pick: "A guitar pick has landed. Click to open.",
    splat: "A paint splat has appeared. Click to open.",
    page: "A book page has floated down. Click to open.",
    pigeon: "A carrier pigeon has landed. Click to open.",
  }[objectType];

  return (
    <div
      className="zone-drop-encounter"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 55,
        pointerEvents: "none",
      }}
      aria-live="polite"
    >
      {/* Zone object element */}
      {showObject && (
        <div
          role="button"
          tabIndex={internalState === "landed" ? 0 : -1}
          aria-label={objectLabel}
          onClick={handleObjectClick}
          onKeyDown={handleKeyDown}
          className={`zone-drop-object zone-drop-${objectType}`}
          style={{
            position: "absolute",
            pointerEvents: internalState === "landed" ? "auto" : "none",
            cursor: internalState === "landed" ? "pointer" : "default",
            outline: "none",
            ...objectStyle,
          }}
        >
          <ZoneObject type={objectType} hoverable={internalState === "landed"} />
        </div>
      )}

      {/* Fading object for accepted state */}
      {internalState === "exit-fade" && (
        <div
          className="zone-drop-fade-out"
          style={{
            position: "absolute",
            left: landingPos.x,
            top: landingPos.y,
            pointerEvents: "none",
          }}
        >
          <ZoneObject type={objectType} hoverable={false} />
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

// ─── Object style computation per state ─────────────────────────────────────
function computeObjectStyle(
  state: InternalState,
  objectType: ZoneObjectType,
  startPos: { x: number; y: number },
  landingPos: { x: number; y: number },
  reducedMotion: boolean,
): React.CSSProperties {
  const animName = `zone-drop-${objectType}-enter`;

  switch (state) {
    case "entering":
      return {
        left: startPos.x,
        top: startPos.y,
        animation: reducedMotion
          ? "none"
          : `${animName} ${FLIGHT_DURATION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards`,
        "--zd-end-x": `${landingPos.x - startPos.x}px`,
        "--zd-end-y": `${landingPos.y - startPos.y}px`,
        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.2))",
      } as React.CSSProperties;

    case "landed":
      return {
        left: landingPos.x,
        top: landingPos.y,
        transform: "rotate(0deg) scale(1)",
        transition: "transform 200ms ease",
        filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.1))",
      };

    case "unfolding":
      return {
        left: landingPos.x,
        top: landingPos.y,
        animation: `zone-drop-unfold ${UNFOLD_DURATION_MS}ms ease-in-out forwards`,
        transformOrigin: "center center",
      };

    case "refolding":
      return {
        left: landingPos.x,
        top: landingPos.y,
        animation: `zone-drop-refold ${REFOLD_DURATION_MS}ms ease-in-out forwards`,
        transformOrigin: "center center",
      };

    case "exit-fly":
      return {
        left: landingPos.x,
        top: landingPos.y,
        animation: `zone-drop-exit-fly ${EXIT_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
        "--zd-return-x": `${startPos.x - landingPos.x}px`,
        "--zd-return-y": `${startPos.y - landingPos.y}px`,
        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.2))",
      } as React.CSSProperties;

    case "exit-drift":
      return {
        left: landingPos.x,
        top: landingPos.y,
        animation: `zone-drop-drift ${DRIFT_DURATION_MS}ms ease-in forwards`,
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

// ─── Zone Object Shape Router ───────────────────────────────────────────────
function ZoneObject({ type, hoverable }: { type: ZoneObjectType; hoverable: boolean }) {
  switch (type) {
    case "pick":
      return <GuitarPickShape hoverable={hoverable} />;
    case "splat":
      return <PaintSplatShape hoverable={hoverable} />;
    case "page":
      return <BookPageShape hoverable={hoverable} />;
    case "pigeon":
      return <CarrierPigeonShape hoverable={hoverable} />;
    default:
      return <GuitarPickShape hoverable={hoverable} />;
  }
}

// ─── 1. WORKSHOP: Guitar Pick ───────────────────────────────────────────────
function GuitarPickShape({ hoverable }: { hoverable: boolean }) {
  return (
    <div
      className={`zone-drop-visual ${hoverable ? "zone-drop-pick-hoverable" : ""}`}
      style={{
        position: "relative",
        width: 30,
        height: 35,
        transition: hoverable ? "transform 200ms ease" : undefined,
      }}
      aria-hidden="true"
    >
      {/* Pick body — rounded triangle via clip-path */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #a07818 0%, #8B6914 40%, #6d5010 100%)",
          clipPath: "polygon(50% 100%, 5% 25%, 20% 5%, 50% 0%, 80% 5%, 95% 25%)",
          borderRadius: "4px",
        }}
      />
      {/* Amber edge highlight */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,191,0,0.4) 0%, transparent 50%)",
          clipPath: "polygon(50% 100%, 5% 25%, 20% 5%, 50% 0%, 80% 5%, 95% 25%)",
          borderRadius: "4px",
        }}
      />
      {/* Surface shine */}
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 8,
          width: 10,
          height: 6,
          background: "rgba(255, 255, 255, 0.15)",
          borderRadius: "50%",
          transform: "rotate(-20deg)",
        }}
      />
    </div>
  );
}

// ─── 2. GALLERY: Paint Splat ────────────────────────────────────────────────
function PaintSplatShape({ hoverable }: { hoverable: boolean }) {
  return (
    <div
      className={`zone-drop-visual ${hoverable ? "zone-drop-splat-hoverable" : ""}`}
      style={{
        position: "relative",
        width: 35,
        height: 30,
        transition: hoverable ? "transform 200ms ease" : undefined,
      }}
      aria-hidden="true"
    >
      {/* Main blob */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 40% 40%, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)",
          borderRadius: "40% 60% 55% 45% / 60% 40% 45% 55%",
          opacity: 0.9,
        }}
      />
      {/* Secondary blob — offset */}
      <div
        style={{
          position: "absolute",
          top: -3,
          right: 2,
          width: 14,
          height: 12,
          background: "#8b5cf6",
          borderRadius: "55% 45% 50% 50% / 45% 55% 50% 50%",
          opacity: 0.7,
        }}
      />
      {/* Drip */}
      <div
        style={{
          position: "absolute",
          bottom: -4,
          left: 12,
          width: 6,
          height: 8,
          background: "#7c3aed",
          borderRadius: "40% 40% 50% 50%",
          opacity: 0.8,
        }}
      />
      {/* Highlight */}
      <div
        style={{
          position: "absolute",
          top: 6,
          left: 8,
          width: 6,
          height: 4,
          background: "rgba(255, 255, 255, 0.25)",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}

// ─── 3. LIBRARYNTH: Book Page ───────────────────────────────────────────────
function BookPageShape({ hoverable }: { hoverable: boolean }) {
  return (
    <div
      className={`zone-drop-visual ${hoverable ? "zone-drop-page-hoverable" : ""}`}
      style={{
        position: "relative",
        width: 35,
        height: 45,
        transition: hoverable ? "transform 200ms ease" : undefined,
      }}
      aria-hidden="true"
    >
      {/* Page body */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#f5f0e8",
          clipPath: "polygon(0 0, 75% 0, 100% 20%, 100% 100%, 0 100%)",
          boxShadow: "1px 1px 3px rgba(0,0,0,0.1)",
        }}
      />
      {/* Corner fold triangle */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderWidth: "0 10px 10px 0",
          borderColor: "transparent #d4cfc5 transparent transparent",
        }}
      />
      {/* Fold shadow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 10,
          height: 10,
          background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%)",
        }}
      />
      {/* Text lines — repeating gradient */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 5,
          right: 5,
          bottom: 6,
          background: `repeating-linear-gradient(
            180deg,
            rgba(100, 80, 60, 0.12) 0px,
            rgba(100, 80, 60, 0.12) 1px,
            transparent 1px,
            transparent 5px
          )`,
        }}
      />
    </div>
  );
}

// ─── 4. CONTACT: Carrier Pigeon ─────────────────────────────────────────────
function CarrierPigeonShape({ hoverable }: { hoverable: boolean }) {
  return (
    <div
      className={`zone-drop-visual ${hoverable ? "zone-drop-pigeon-hoverable" : ""}`}
      style={{
        position: "relative",
        width: 40,
        height: 30,
        transition: hoverable ? "transform 200ms ease" : undefined,
      }}
      aria-hidden="true"
    >
      {/* Body */}
      <div
        style={{
          position: "absolute",
          bottom: 2,
          left: 8,
          width: 22,
          height: 14,
          background: "linear-gradient(180deg, #d0d0d0 0%, #c0c0c0 60%, #b0b0b0 100%)",
          borderRadius: "50% 40% 40% 50%",
        }}
      />
      {/* Head */}
      <div
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 12,
          height: 11,
          background: "linear-gradient(180deg, #c8c8c8 0%, #b8b8b8 100%)",
          borderRadius: "55% 55% 45% 45%",
        }}
      />
      {/* Eye */}
      <div
        style={{
          position: "absolute",
          top: 7,
          right: 7,
          width: 3,
          height: 3,
          background: "#333",
          borderRadius: "50%",
        }}
      />
      {/* Beak */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderWidth: "2px 0 2px 5px",
          borderColor: "transparent transparent transparent #e8a020",
        }}
      />
      {/* Wing (resting state) */}
      <div
        className="zone-drop-pigeon-wing"
        style={{
          position: "absolute",
          bottom: 6,
          left: 10,
          width: 18,
          height: 10,
          background: "linear-gradient(180deg, #a8a8a8 0%, #909090 100%)",
          borderRadius: "60% 30% 30% 60%",
          transformOrigin: "right center",
        }}
      />
      {/* Tail */}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          left: 2,
          width: 10,
          height: 6,
          background: "#a0a0a0",
          clipPath: "polygon(100% 20%, 0% 0%, 20% 100%)",
        }}
      />
      {/* Note/letter on leg */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 10,
          width: 6,
          height: 4,
          background: "#f5f0e8",
          border: "0.5px solid rgba(0,0,0,0.2)",
          borderRadius: 1,
        }}
      />
    </div>
  );
}
