"use client";

import { useState, useEffect, useCallback } from "react";

type PermissionState = "unknown" | "granted" | "denied" | "unsupported";

export interface DeviceCapabilities {
  isMobile: boolean;
  hasHover: boolean;
  supportsVibration: boolean;
  motionPermission: PermissionState;
  orientationPermission: PermissionState;
  requestMotionPermission: () => Promise<boolean>;
  requestOrientationPermission: () => Promise<boolean>;
}

export function useDeviceCapabilities(): DeviceCapabilities {
  const [isMobile, setIsMobile] = useState(false);
  const [hasHover, setHasHover] = useState(true);
  const [supportsVibration, setSupportsVibration] = useState(false);
  const [motionPermission, setMotionPermission] = useState<PermissionState>("unknown");
  const [orientationPermission, setOrientationPermission] = useState<PermissionState>("unknown");

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    setHasHover(window.matchMedia("(hover: hover)").matches);
    setSupportsVibration(!!navigator.vibrate);

    // DeviceMotionEvent support
    if (typeof DeviceMotionEvent === "undefined") {
      setMotionPermission("unsupported");
    } else if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      setMotionPermission("unknown"); // iOS — needs user gesture
    } else {
      setMotionPermission("granted"); // Android / desktop — no permission needed
    }

    // DeviceOrientationEvent support
    if (typeof DeviceOrientationEvent === "undefined") {
      setOrientationPermission("unsupported");
    } else if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      setOrientationPermission("unknown"); // iOS
    } else {
      setOrientationPermission("granted"); // Android / desktop
    }

    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize, { passive: true });

    const hoverMq = window.matchMedia("(hover: hover)");
    const onHoverChange = (e: MediaQueryListEvent) => setHasHover(e.matches);
    hoverMq.addEventListener("change", onHoverChange);

    return () => {
      window.removeEventListener("resize", onResize);
      hoverMq.removeEventListener("change", onHoverChange);
    };
  }, []);

  const requestMotionPermission = useCallback(async (): Promise<boolean> => {
    if (motionPermission === "granted") return true;
    if (motionPermission === "unsupported" || motionPermission === "denied") return false;
    try {
      const result = await (DeviceMotionEvent as any).requestPermission();
      const granted = result === "granted";
      setMotionPermission(granted ? "granted" : "denied");
      return granted;
    } catch {
      setMotionPermission("denied");
      return false;
    }
  }, [motionPermission]);

  const requestOrientationPermission = useCallback(async (): Promise<boolean> => {
    if (orientationPermission === "granted") return true;
    if (orientationPermission === "unsupported" || orientationPermission === "denied") return false;
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission();
      const granted = result === "granted";
      setOrientationPermission(granted ? "granted" : "denied");
      return granted;
    } catch {
      setOrientationPermission("denied");
      return false;
    }
  }, [orientationPermission]);

  return {
    isMobile,
    hasHover,
    supportsVibration,
    motionPermission,
    orientationPermission,
    requestMotionPermission,
    requestOrientationPermission,
  };
}

// ── Non-hook utilities (for use inside effects / event handlers) ──

export function checkIsMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth <= 768;
}

export function checkHasHover(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
}

/** Safe vibration wrapper — no-op on iOS Safari and other unsupported browsers */
export function tryVibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Silently fail
  }
}
