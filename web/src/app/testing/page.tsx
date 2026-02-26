"use client";

import { useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import { emitGameEvent } from "@/lib/game-events";
import type { GodotEvent } from "@/lib/godot-messages";

function TestingInner() {
  const searchParams = useSearchParams();
  const gameName = searchParams.get("game");

  const handleGodotEvent = useCallback(
    (event: GodotEvent) => {
      emitGameEvent(event);
      console.log(`[Testing:${gameName}] Godot event:`, event);
    },
    [gameName]
  );

  if (!gameName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-black text-white">
        <h1 className="text-2xl font-mono text-shelley-amber">Staging Route</h1>
        <p className="text-white/50 font-mono">
          Use <code className="text-shelley-amber">?game=gameName</code> to load a game.
        </p>
        <p className="text-white/30 text-sm font-mono">
          Example: /testing?game=po_runner
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <GodotEmbed
        gameName={gameName}
        onEvent={handleGodotEvent}
        fullScreen
      />
    </div>
  );
}

export default function Testing() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <TestingInner />
    </Suspense>
  );
}
