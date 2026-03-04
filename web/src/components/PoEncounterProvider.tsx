"use client";

import React, { createContext, useState, useCallback, useEffect, useRef } from "react";
import type { PoEncounterState, EncounterType, EncounterPhase } from "@/hooks/usePoEncounter";
import { useCodecOverlay } from "@/hooks/useCodecOverlay";
import { useZoneSidebar } from "@/components/ZoneSidebarContext";
import { useTransition } from "@/components/TransitionContext";

export const PoEncounterContext = createContext<PoEncounterState | null>(null);

// --- Constants ---
const BASE_COOLDOWN_MS = 60_000;
const MAX_COOLDOWN_MS = 300_000;
const GRACE_PERIOD_MS = 10_000;
const IDLE_THRESHOLD_MS = 12_000;
const HOVER_DWELL_MS = 4_000;
const SCROLL_DEPTH_THRESHOLD = 0.8;
const SESSION_ENCOUNTER_CAP = 5;
const RANDOM_TIMER_MIN_MS = 90_000;
const RANDOM_TIMER_MAX_MS = 180_000;
const VISITED_ZONES_KEY = "po_visited_zones";
const CODEC_RING_COUNT_KEY = "po_codec_ring_count";
const CODEC_RING_DATE_KEY = "po_codec_ring_date";
const CODEC_RING_DAILY_CAP = 3;
const PHONE_TAB_HOVER_MS = 2_500;
const SCROLL_BACK_UP_THRESHOLD = 0.5; // must scroll past 50% first

function isInteractiveElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "a" || tag === "button") return true;
  if (el.getAttribute("role") === "button") return true;
  return false;
}

function getVisitedZones(): Set<string> {
  try {
    const raw = sessionStorage.getItem(VISITED_ZONES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markZoneVisited(zoneId: string): void {
  try {
    const visited = getVisitedZones();
    visited.add(zoneId);
    sessionStorage.setItem(VISITED_ZONES_KEY, JSON.stringify(Array.from(visited)));
  } catch {
    // sessionStorage unavailable — silent fail
  }
}

function getCodecRingCount(): number {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const storedDate = localStorage.getItem(CODEC_RING_DATE_KEY);
    if (storedDate !== today) {
      // New day — reset
      localStorage.setItem(CODEC_RING_DATE_KEY, today);
      localStorage.setItem(CODEC_RING_COUNT_KEY, "0");
      return 0;
    }
    return parseInt(localStorage.getItem(CODEC_RING_COUNT_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

function incrementCodecRingCount(): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(CODEC_RING_DATE_KEY, today);
    const count = getCodecRingCount();
    localStorage.setItem(CODEC_RING_COUNT_KEY, String(count + 1));
  } catch {
    // localStorage unavailable
  }
}

function canCodecRing(): boolean {
  return getCodecRingCount() < CODEC_RING_DAILY_CAP;
}

export function PoEncounterProvider({ children }: { children: React.ReactNode }) {
  // --- External contexts (read-only) ---
  const codec = useCodecOverlay();
  const zone = useZoneSidebar();
  const transition = useTransition();

  // --- Encounter state machine ---
  const [activeEncounter, setActiveEncounter] = useState<EncounterType | null>(null);
  const [encounterPhase, setEncounterPhase] = useState<EncounterPhase>("idle");

  // --- Cooldown + session tracking (refs for timer callbacks) ---
  const cooldownMs = useRef(BASE_COOLDOWN_MS);
  const cooldownUntil = useRef(0);
  const unsolicitedCount = useRef(0);
  const dismissCount = useRef(0);
  const mountTime = useRef(Date.now());
  const hasHadEncounter = useRef(false);

  // --- Stable refs for values read inside event handlers / timers ---
  const codecOpenRef = useRef(codec.isOpen);
  const transitionActiveRef = useRef(transition.isActive);
  const zoneRef = useRef(zone);
  const encounterPhaseRef = useRef(encounterPhase);

  useEffect(() => { codecOpenRef.current = codec.isOpen; }, [codec.isOpen]);
  useEffect(() => { transitionActiveRef.current = transition.isActive; }, [transition.isActive]);
  useEffect(() => { zoneRef.current = zone; }, [zone]);
  useEffect(() => { encounterPhaseRef.current = encounterPhase; }, [encounterPhase]);

  // --- Guard: can we fire an unsolicited encounter? ---
  const canTrigger = useCallback((): boolean => {
    if (encounterPhaseRef.current !== "idle") return false;
    if (codecOpenRef.current) return false;
    if (transitionActiveRef.current) return false;
    if (Date.now() - mountTime.current < GRACE_PERIOD_MS) return false;
    if (unsolicitedCount.current >= SESSION_ENCOUNTER_CAP) return false;
    if (Date.now() < cooldownUntil.current) return false;
    return true;
  }, []);

  // --- Fire an encounter (unsolicited) ---
  const fireEncounter = useCallback((type: EncounterType) => {
    if (!canTrigger()) return;
    unsolicitedCount.current += 1;
    hasHadEncounter.current = true;
    setActiveEncounter(type);
    setEncounterPhase("entering");
  }, [canTrigger]);

  // --- Start cooldown ---
  const startCooldown = useCallback(() => {
    cooldownUntil.current = Date.now() + cooldownMs.current;
  }, []);

  // --- Public methods ---
  const acceptEncounter = useCallback(() => {
    setEncounterPhase("accepted");
    // Reset cooldown to base on accept
    cooldownMs.current = BASE_COOLDOWN_MS;
    dismissCount.current = 0;
    startCooldown();
    // Open codec with zone-appropriate costume
    const z = zoneRef.current;
    codec.openCodec(z?.poCostume ?? "default", z?.id ?? null);
  }, [codec, startCooldown]);

  const dismissEncounter = useCallback(() => {
    setEncounterPhase("dismissed");
    // Double cooldown on dismiss
    dismissCount.current += 1;
    cooldownMs.current = Math.min(
      BASE_COOLDOWN_MS * Math.pow(2, dismissCount.current),
      MAX_COOLDOWN_MS,
    );
    startCooldown();
  }, [startCooldown]);

  const clearEncounter = useCallback(() => {
    setActiveEncounter(null);
    setEncounterPhase("idle");
  }, []);

  const triggerEncounter = useCallback((type: EncounterType) => {
    // Manual trigger — bypasses cooldown/cap
    setActiveEncounter(type);
    setEncounterPhase("entering");
  }, []);

  // --- Auto-transition: entering → waiting after entrance animation ---
  useEffect(() => {
    if (encounterPhase !== "entering") return;
    const id = setTimeout(() => setEncounterPhase("waiting"), 300);
    return () => clearTimeout(id);
  }, [encounterPhase]);

  // =====================================================================
  // DETECTION LOGIC — all runs inside effects, cleaned up on unmount
  // =====================================================================

  // --- A) IDLE DETECTION ---
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // Idle threshold reached — pick paper_plane or knock
        const type: EncounterType = Math.random() < 0.6 ? "paper_plane" : "knock";
        fireEncounter(type);
      }, IDLE_THRESHOLD_MS);
    };

    const events = ["mousemove", "scroll", "click", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle(); // start initial timer

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
    };
  }, [fireEncounter]);

  // --- B) SCROLL DEPTH ---
  useEffect(() => {
    let fired = false;

    const onScroll = () => {
      if (fired) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const ratio = scrollTop / docHeight;
      if (ratio > SCROLL_DEPTH_THRESHOLD) {
        fired = true;
        fireEncounter("zone_drop");
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [fireEncounter]);

  // --- C) HOVER DWELL ---
  useEffect(() => {
    let dwellTimer: ReturnType<typeof setTimeout> | null = null;
    let currentTarget: Element | null = null;

    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target === currentTarget) return;
      currentTarget = target;
      if (dwellTimer) clearTimeout(dwellTimer);

      if (isInteractiveElement(target)) {
        dwellTimer = setTimeout(() => {
          fireEncounter("knock");
        }, HOVER_DWELL_MS);
      }
    };

    const onOut = () => {
      currentTarget = null;
      if (dwellTimer) clearTimeout(dwellTimer);
    };

    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    return () => {
      if (dwellTimer) clearTimeout(dwellTimer);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, [fireEncounter]);

  // --- D1) CODEC RING: Phone tab hover (2.5s dwell) ---
  useEffect(() => {
    let hoverTimer: ReturnType<typeof setTimeout> | null = null;

    const onEnter = () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (canCodecRing()) {
          incrementCodecRingCount();
          fireEncounter("codec_ring");
        }
      }, PHONE_TAB_HOVER_MS);
    };

    const onLeave = () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = null;
    };

    // Bind to the phone booth tab
    const tab = document.querySelector(".phone-booth-tab");
    if (tab) {
      tab.addEventListener("mouseenter", onEnter);
      tab.addEventListener("mouseleave", onLeave);
    }

    return () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      if (tab) {
        tab.removeEventListener("mouseenter", onEnter);
        tab.removeEventListener("mouseleave", onLeave);
      }
    };
  }, [fireEncounter]);

  // --- D2) CODEC RING: Scroll back up (scroll past 50%, then back to top 10%) ---
  useEffect(() => {
    let passedThreshold = false;

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const ratio = scrollTop / docHeight;

      if (ratio > SCROLL_BACK_UP_THRESHOLD) {
        passedThreshold = true;
      }

      if (passedThreshold && ratio < 0.1) {
        passedThreshold = false;
        if (canCodecRing()) {
          incrementCodecRingCount();
          fireEncounter("codec_ring");
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [fireEncounter]);

  // --- E) RANDOM TIMER ---
  useEffect(() => {
    const schedule = () => {
      const delay = RANDOM_TIMER_MIN_MS + Math.random() * (RANDOM_TIMER_MAX_MS - RANDOM_TIMER_MIN_MS);
      return setTimeout(() => {
        if (!hasHadEncounter.current) {
          fireEncounter("cursor_stalk");
        }
        // Reschedule regardless — fireEncounter guards internally
        timerId = schedule();
      }, delay);
    };

    let timerId = schedule();
    return () => clearTimeout(timerId);
  }, [fireEncounter]);

  // --- Context value (stable reference via individual deps) ---
  const value: PoEncounterState = {
    activeEncounter,
    encounterPhase,
    acceptEncounter,
    dismissEncounter,
    clearEncounter,
    triggerEncounter,
  };

  return (
    <PoEncounterContext.Provider value={value}>
      {children}
    </PoEncounterContext.Provider>
  );
}

export default PoEncounterProvider;
