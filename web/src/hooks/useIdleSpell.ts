"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const IDLE_THRESHOLD_MS = 180_000; // 3 minutes
const SESSION_KEY = "shelley_spell_seen";

/**
 * Detects user idle state for the Shelley Spell easter egg.
 * Returns showSpell when user has been idle for 3 minutes (one-time per session).
 */
export function useIdleSpell() {
  const [showSpell, setShowSpell] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissSpell = useCallback(() => {
    setShowSpell(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  useEffect(() => {
    // Already seen this session
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // sessionStorage unavailable — allow spell
    }

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShowSpell(true);
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          // silent
        }
      }, IDLE_THRESHOLD_MS);
    };

    const events = ["mousemove", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true }),
    );
    resetTimer(); // start initial timer

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, []);

  return { showSpell, dismissSpell };
}
