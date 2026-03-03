"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { getGameForRoute, type RouteGameConfig } from "@/lib/game-routes";

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

  const navigate = useCallback((url: string) => {
    // Brief hold keeps overlay black, prevents white flash during hard reload
    setTimeout(() => {
      window.location.href = url;
    }, 200);
  }, []);

  const startTransition = useCallback((url: string) => {
    const game = getGameForRoute(url);
    if (game) {
      setPendingUrl(url);
      setActiveGame(game);
      setIsActive(true);
    } else {
      // No game — show quick wipe overlay then navigate
      setPendingUrl(url);
      setQuickTransit(true);
      setIsActive(true);
    }
  }, []);

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
    <TransitionContext.Provider value={{ startTransition, skip, isActive, pendingUrl, activeGame, quickTransit, complete, replayGame, isReplay }}>
      {children}
    </TransitionContext.Provider>
  );
}
