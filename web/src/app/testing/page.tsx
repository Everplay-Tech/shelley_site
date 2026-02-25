"use client";

import { useCallback } from "react";
import GodotEmbed from "@/components/GodotEmbed";
import { emitGameEvent } from "@/lib/game-events";
import type { GodotEvent } from "@/lib/godot-messages";

export default function Testing() {
  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
    console.log("[Testing] Godot event:", event);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <GodotEmbed
        gameName="po_moped"
        onEvent={handleGodotEvent}
        fullScreen
      />
    </div>
  );
}
