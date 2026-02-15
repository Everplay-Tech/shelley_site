// Lightweight typed event emitter for Godot events.
// Allows any component to subscribe to game events globally,
// regardless of where the GodotEmbed iframe lives in the tree.

import type { GodotEvent } from "./godot-messages";

type Listener = (event: GodotEvent) => void;

const listeners = new Set<Listener>();

export function emitGameEvent(event: GodotEvent): void {
  listeners.forEach((fn) => fn(event));
}

export function onGameEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
