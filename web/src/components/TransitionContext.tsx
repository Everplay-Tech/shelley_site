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
  complete: () => void;
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

  const navigate = useCallback((url: string) => {
    setIsActive(false);
    setPendingUrl(null);
    setActiveGame(null);
    window.location.href = url;
  }, []);

  const startTransition = useCallback((url: string) => {
    const game = getGameForRoute(url);
    if (game) {
      setPendingUrl(url);
      setActiveGame(game);
      setIsActive(true);
    } else {
      // No game for this route — navigate directly
      window.location.href = url;
    }
  }, []);

  const skip = useCallback(() => {
    if (pendingUrl) {
      navigate(pendingUrl);
    } else {
      setIsActive(false);
      setPendingUrl(null);
      setActiveGame(null);
    }
  }, [pendingUrl, navigate]);

  const complete = useCallback(() => {
    if (pendingUrl) {
      navigate(pendingUrl);
    }
  }, [pendingUrl, navigate]);

  return (
    <TransitionContext.Provider value={{ startTransition, skip, isActive, pendingUrl, activeGame, complete }}>
      {children}
    </TransitionContext.Provider>
  );
}
