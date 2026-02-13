"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface TransitionContextValue {
  /** Trigger a mini-game transition before navigating to a URL */
  startTransition: (url: string) => void;
  /** Skip the current transition and navigate immediately */
  skip: () => void;
  /** Whether a transition is currently playing */
  isActive: boolean;
  /** The URL we're transitioning to */
  pendingUrl: string | null;
  /** Called when the mini-game signals completion */
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

  const navigate = useCallback((url: string) => {
    setIsActive(false);
    setPendingUrl(null);
    // Use window.location for a clean nav after the transition overlay clears
    window.location.href = url;
  }, []);

  const startTransition = useCallback((url: string) => {
    setPendingUrl(url);
    setIsActive(true);
  }, []);

  const skip = useCallback(() => {
    if (pendingUrl) {
      navigate(pendingUrl);
    } else {
      setIsActive(false);
      setPendingUrl(null);
    }
  }, [pendingUrl, navigate]);

  const complete = useCallback(() => {
    if (pendingUrl) {
      navigate(pendingUrl);
    }
  }, [pendingUrl, navigate]);

  return (
    <TransitionContext.Provider value={{ startTransition, skip, isActive, pendingUrl, complete }}>
      {children}
    </TransitionContext.Provider>
  );
}
