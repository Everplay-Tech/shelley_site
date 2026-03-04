"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { getGameForRoute, type RouteGameConfig } from "@/lib/game-routes";
import { usePreferences } from "@/hooks/usePreferences";

interface TransitionContextValue {
  startTransition: (url: string) => void;
  skip: () => void;
  isActive: boolean;
  pendingUrl: string | null;
  /** The game config for the current transition (null = no game, just navigate) */
  activeGame: RouteGameConfig | null;
  /** True when transitioning without a game (quick wipe overlay) */
  quickTransit: boolean;
  complete: () => void;
  /** Open a game overlay without navigation (e.g. from GameCartridge) */
  replayGame: (game: RouteGameConfig) => void;
  /** True when the overlay is a replay (close on complete, don't navigate) */
  isReplay: boolean;
  /** Whether transition games are enabled (user preference) */
  gamesEnabled: boolean;
  /** Toggle games on/off */
  setGamesEnabled: (enabled: boolean) => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function useTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error("useTransition must be used within TransitionProvider");
  return ctx;
}

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [activeGame, setActiveGame] = useState<RouteGameConfig | null>(null);
  const [quickTransit, setQuickTransit] = useState(false);
  const [isReplay, setIsReplay] = useState(false);
  const { gamesEnabled, setGamesEnabled } = usePreferences();

  const navigate = useCallback((url: string) => {
    // Brief hold keeps overlay black, prevents white flash during hard reload
    setTimeout(() => {
      window.location.href = url;
    }, 200);
  }, []);

  const startTransition = useCallback((url: string) => {
    const game = getGameForRoute(url);
    // Play game only if user has games enabled
    if (game && gamesEnabled) {
      setPendingUrl(url);
      setActiveGame(game);
      setIsActive(true);
    } else {
      // No game or games disabled — show quick wipe overlay then navigate
      setPendingUrl(url);
      setQuickTransit(true);
      setIsActive(true);
    }
  }, [gamesEnabled]);

  const resetOverlay = useCallback(() => {
    setIsActive(false);
    setPendingUrl(null);
    setActiveGame(null);
    setQuickTransit(false);
    setIsReplay(false);
  }, []);

  const skip = useCallback(() => {
    if (isReplay) {
      resetOverlay();
    } else if (pendingUrl) {
      navigate(pendingUrl);
    } else {
      resetOverlay();
    }
  }, [isReplay, pendingUrl, navigate, resetOverlay]);

  const complete = useCallback(() => {
    if (isReplay) {
      resetOverlay();
    } else if (pendingUrl) {
      navigate(pendingUrl);
    }
  }, [isReplay, pendingUrl, navigate, resetOverlay]);

  const replayGame = useCallback((game: RouteGameConfig) => {
    setActiveGame(game);
    setIsReplay(true);
    setIsActive(true);
  }, []);

  return (
    <TransitionContext.Provider value={{ startTransition, skip, isActive, pendingUrl, activeGame, quickTransit, complete, replayGame, isReplay, gamesEnabled, setGamesEnabled }}>
      {children}
    </TransitionContext.Provider>
  );
}
