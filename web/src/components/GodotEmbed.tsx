"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";
import { useGodotBridge } from "@/hooks/useGodotBridge";
import type { GodotCommand, GodotEvent } from "@/lib/godot-messages";

export interface GodotEmbedHandle {
  sendCommand: (command: GodotCommand) => void;
}

interface GodotEmbedProps {
  gameName: string;
  onEvent?: (event: GodotEvent) => void;
  className?: string;
}

const GodotEmbed = forwardRef<GodotEmbedHandle, GodotEmbedProps>(
  function GodotEmbed({ gameName, onEvent, className }, ref) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { iframeRef, sendCommand } = useGodotBridge({ onEvent });

    useImperativeHandle(ref, () => ({ sendCommand }), [sendCommand]);

    return (
      <div
        className={`relative w-full aspect-video bg-shelley-charcoal rounded-lg overflow-hidden ${className ?? ""}`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-shelley-charcoal z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shelley-amber" />
              <span className="text-white/40 text-sm font-mono">Loading {gameName}...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-shelley-charcoal z-10">
            <div className="text-center">
              <p className="text-red-400 mb-2">{error}</p>
              <p className="text-white/40 text-sm">
                Game files will appear here once exported from Godot.
              </p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={`/games/${gameName}/index.html`}
          title={`${gameName} game`}
          className="w-full h-full border-none"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(`Failed to load ${gameName}.`);
          }}
          allow="autoplay; focus-without-user-activation"
        />
      </div>
    );
  }
);

export default GodotEmbed;
