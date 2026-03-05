"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePoEncounter } from "@/hooks/usePoEncounter";
import { tryVibrate } from "@/hooks/useDeviceCapabilities";

/* -----------------------------------------
   CodecRingMobileToast

   Slide-up notification banner for codec ring
   on mobile, replacing the hidden PhoneBooth.
   ----------------------------------------- */

const RING_CYCLE_MS = 1800;
const RING_COUNT = 4;
const EXIT_DURATION_MS = 300;

export default function CodecRingMobileToast() {
  const {
    activeEncounter,
    encounterPhase,
    acceptEncounter,
    dismissEncounter,
    clearEncounter,
  } = usePoEncounter();

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [ringCycle, setRingCycle] = useState(0);
  const [visible, setVisible] = useState(false);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  // Show toast on entering
  useEffect(() => {
    if (activeEncounter !== "codec_ring" || encounterPhase !== "entering") return;
    setVisible(true);
    setRingCycle(0);
  }, [activeEncounter, encounterPhase]);

  // Ring cycle counting during waiting
  useEffect(() => {
    if (activeEncounter !== "codec_ring" || encounterPhase !== "waiting") return;
    let cycleCount = 0;

    const runCycle = () => {
      if (cycleCount >= RING_COUNT) {
        dismissEncounter();
        return;
      }
      tryVibrate([100, 50, 100]);
      setRingCycle((c) => c + 1);
      cycleCount++;
      addTimeout(runCycle, RING_CYCLE_MS);
    };

    runCycle();
    return clearAllTimers;
  }, [activeEncounter, encounterPhase, dismissEncounter, addTimeout, clearAllTimers]);

  // Dismiss animation
  useEffect(() => {
    if (activeEncounter !== "codec_ring" || encounterPhase !== "dismissed") return;
    setVisible(false);
    addTimeout(() => clearEncounter(), EXIT_DURATION_MS);
    return () => clearAllTimers();
  }, [activeEncounter, encounterPhase, clearEncounter, addTimeout, clearAllTimers]);

  // Accept animation
  useEffect(() => {
    if (activeEncounter !== "codec_ring" || encounterPhase !== "accepted") return;
    setVisible(false);
    addTimeout(() => clearEncounter(), 200);
    return () => clearAllTimers();
  }, [activeEncounter, encounterPhase, clearEncounter, addTimeout, clearAllTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  if (activeEncounter !== "codec_ring") return null;
  if (encounterPhase === "idle") return null;

  return (
    <div
      className={`codec-ring-mobile-toast ${visible ? "codec-ring-mobile-toast--visible" : ""}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="codec-ring-mobile-toast-inner">
        <div className="codec-ring-mobile-icon" aria-hidden="true">
          <span className={ringCycle > 0 ? "codec-ring-mobile-shake" : ""}>
            &#x260E;
          </span>
        </div>
        <div className="codec-ring-mobile-text">
          <span className="codec-ring-mobile-label">INCOMING CALL</span>
          <span className="codec-ring-mobile-sub">Po wants to talk</span>
        </div>
        {encounterPhase === "waiting" && (
          <div className="codec-ring-mobile-actions">
            <button
              onClick={acceptEncounter}
              className="codec-ring-mobile-answer"
              aria-label="Answer call from Po"
            >
              ANSWER
            </button>
            <button
              onClick={dismissEncounter}
              className="codec-ring-mobile-ignore"
              aria-label="Ignore call"
            >
              &#x2715;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
