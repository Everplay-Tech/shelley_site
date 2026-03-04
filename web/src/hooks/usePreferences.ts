"use client";

import { useState, useEffect, useCallback } from "react";
import { getCookie, setCookie } from "@/lib/cookies";
import { DEFAULT_PREFERENCES, PREFS_COOKIE } from "@/lib/preferences";
import type { UserPreferences } from "@/lib/preferences";

export function usePreferences() {
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Read from cookie on mount
  useEffect(() => {
    const raw = getCookie(PREFS_COOKIE);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch {
        // ignore malformed cookie
      }
    }
  }, []);

  const setGamesEnabled = useCallback(
    (enabled: boolean) => {
      const updated: UserPreferences = { ...preferences, gamesEnabled: enabled };
      setPreferences(updated);
      // Persist to cookie (client-readable, 1 year)
      setCookie(PREFS_COOKIE, JSON.stringify(updated), 365);
      // Sync to server (fire and forget)
      fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).catch(() => {});
    },
    [preferences]
  );

  return {
    gamesEnabled: preferences.gamesEnabled,
    setGamesEnabled,
    preferences,
  };
}
