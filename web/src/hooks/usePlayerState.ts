"use client";

import { useSyncExternalStore, useEffect, useCallback } from "react";
import {
  subscribe,
  getSnapshot,
  initSession,
  reportGameEvent,
  type GameProgress,
  type GameEvent,
} from "@/lib/player-state";

/**
 * React hook for player state. Initializes session on mount,
 * re-renders on progress updates.
 */
export function usePlayerState() {
  const progress: GameProgress = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    initSession();
  }, []);

  const reportEvent = useCallback(async (event: GameEvent) => {
    return reportGameEvent(event);
  }, []);

  return { progress, reportEvent };
}
