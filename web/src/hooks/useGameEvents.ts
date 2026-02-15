"use client";

import { useEffect, useRef } from "react";
import type { GodotEvent } from "@/lib/godot-messages";
import { onGameEvent } from "@/lib/game-events";

/** Subscribe to global Godot game events. Callback is ref-stable. */
export function useGameEvents(callback: (event: GodotEvent) => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return onGameEvent((event) => callbackRef.current(event));
  }, []);
}
