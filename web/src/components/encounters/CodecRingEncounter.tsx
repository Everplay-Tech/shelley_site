"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePoEncounter } from "@/hooks/usePoEncounter";

/* -----------------------------------------
   CodecRingEncounter (T6)

   Instead of rendering its own UI, this encounter
   opens the PhoneBooth panel, shakes the phone,
   and emits zigzag signal lines from it.
   ----------------------------------------- */

const RING_CYCLE_MS = 1800;
const RING_COUNT = 4;
const EXIT_DURATION_MS = 300;
const ACCEPT_FLASH_MS = 200;

export default function CodecRingEncounter() {
  const {
    activeEncounter,
    encounterPhase,
    acceptEncounter,
    dismissEncounter,
    clearEncounter,
  } = usePoEncounter();

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [ringCycle, setRingCycle] = useState(0);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  // ── Open the phone booth panel and add ringing class when entering ──
  useEffect(() => {
    if (activeEncounter !== "codec_ring") return;
    if (encounterPhase !== "entering") return;

    // Force-open the phone booth panel
    const booth = document.querySelector(".phone-booth");
    if (booth && !booth.classList.contains("phone-booth--open")) {
      booth.classList.add("phone-booth--open");
    }
    // Move the tab too
    const tab = document.querySelector(".phone-booth-tab");
    if (tab) tab.classList.add("phone-booth-tab--open");

    // Add ringing state
    booth?.classList.add("phone-booth--ringing");
  }, [activeEncounter, encounterPhase]);

  // ── Ring cycles during waiting phase ──
  useEffect(() => {
    if (activeEncounter !== "codec_ring") return;
    if (encounterPhase !== "waiting") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cycleCount = 0;

    const runCycle = () => {
      if (cycleCount >= RING_COUNT) {
        dismissEncounter();
        return;
      }

      // Shake the phone
      const phone = document.querySelector(".phone-booth-phone");
      if (phone && !reducedMotion) {
        phone.classList.remove("phone-ring-shake");
        // Force reflow to restart animation
        void (phone as HTMLElement).offsetWidth;
        phone.classList.add("phone-ring-shake");
      }

      setRingCycle((c) => c + 1);
      cycleCount++;
      addTimeout(runCycle, RING_CYCLE_MS);
    };

    runCycle();
    return clearAllTimers;
  }, [activeEncounter, encounterPhase, dismissEncounter, addTimeout, clearAllTimers]);

  // ── Cleanup ringing state on dismiss ──
  useEffect(() => {
    if (activeEncounter !== "codec_ring") return;
    if (encounterPhase !== "dismissed") return;

    const booth = document.querySelector(".phone-booth");
    booth?.classList.remove("phone-booth--ringing");
    const phone = document.querySelector(".phone-booth-phone");
    phone?.classList.remove("phone-ring-shake");

    addTimeout(() => clearEncounter(), EXIT_DURATION_MS);
    return () => clearAllTimers();
  }, [activeEncounter, encounterPhase, clearEncounter, addTimeout, clearAllTimers]);

  // ── Cleanup ringing state on accept ──
  useEffect(() => {
    if (activeEncounter !== "codec_ring") return;
    if (encounterPhase !== "accepted") return;

    const booth = document.querySelector(".phone-booth");
    booth?.classList.remove("phone-booth--ringing");
    const phone = document.querySelector(".phone-booth-phone");
    phone?.classList.remove("phone-ring-shake");

    addTimeout(() => clearEncounter(), ACCEPT_FLASH_MS);
    return () => clearAllTimers();
  }, [activeEncounter, encounterPhase, clearEncounter, addTimeout, clearAllTimers]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      clearAllTimers();
      const booth = document.querySelector(".phone-booth");
      booth?.classList.remove("phone-booth--ringing");
      const phone = document.querySelector(".phone-booth-phone");
      phone?.classList.remove("phone-ring-shake");
    };
  }, [clearAllTimers]);

  // ── Gate ──
  if (activeEncounter !== "codec_ring") return null;
  if (encounterPhase === "idle") return null;

  const isActive = encounterPhase === "entering" || encounterPhase === "waiting";

  return (
    <>
      {/* Zigzag signal lines emanating from the phone booth */}
      {isActive && (
        <div className="codec-ring-signals" aria-hidden="true" key={ringCycle}>
          <div className="codec-ring-zigzag codec-ring-zigzag-1" />
          <div className="codec-ring-zigzag codec-ring-zigzag-2" />
          <div className="codec-ring-zigzag codec-ring-zigzag-3" />
        </div>
      )}

      {/* INCOMING label near the phone booth */}
      {isActive && (
        <div className="codec-ring-incoming">
          <span className="codec-ring-incoming-text">INCOMING</span>
          <span className="codec-ring-incoming-blink">_</span>
        </div>
      )}

      {/* Click-to-answer overlay on the phone booth area */}
      {encounterPhase === "waiting" && (
        <button
          className="codec-ring-answer-zone"
          onClick={acceptEncounter}
          aria-label="Answer incoming transmission"
        />
      )}

      {/* Dismiss option */}
      {encounterPhase === "waiting" && (
        <button
          className="codec-ring-ignore"
          onClick={dismissEncounter}
          aria-label="Ignore transmission"
        >
          IGNORE
        </button>
      )}
    </>
  );
}
