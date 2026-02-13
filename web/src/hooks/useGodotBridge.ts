"use client";

import { useCallback, useEffect, useRef } from "react";
import type { GodotCommand, GodotEvent } from "@/lib/godot-messages";
import { isGodotEvent } from "@/lib/godot-messages";

export interface UseGodotBridgeOptions {
  /** Called when a valid GodotEvent arrives via postMessage */
  onEvent?: (event: GodotEvent) => void;
  /**
   * Allowed origin for incoming messages.
   * Defaults to window.location.origin (same-origin iframes).
   * Set to "*" only during development.
   */
  allowedOrigin?: string;
}

export function useGodotBridge(options: UseGodotBridgeOptions = {}) {
  const { onEvent, allowedOrigin } = options;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Keep a stable ref to the callback so the listener never goes stale
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const sendCommand = useCallback((command: GodotCommand) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    // Always target same-origin iframes served from /games/
    win.postMessage(command, window.location.origin);
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Origin check — allow same-origin by default
      const expected = allowedOrigin ?? window.location.origin;
      if (expected !== "*" && event.origin !== expected) return;

      if (isGodotEvent(event.data)) {
        onEventRef.current?.(event.data);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [allowedOrigin]);

  return { iframeRef, sendCommand } as const;
}
