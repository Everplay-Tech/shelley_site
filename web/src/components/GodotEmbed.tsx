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
  /** When true, fills the parent container instead of using aspect-video */
  fullScreen?: boolean;
}

const GodotEmbed = forwardRef<GodotEmbedHandle, GodotEmbedProps>(
  function GodotEmbed({ gameName, onEvent, className, fullScreen }, ref) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { iframeRef, sendCommand } = useGodotBridge({ onEvent });

    useImperativeHandle(ref, () => ({ sendCommand }), [sendCommand]);

    return (
      <div
        className={`relative bg-shelley-charcoal overflow-hidden ${
          fullScreen ? "w-full h-full" : "w-full aspect-video scanlines"
        } ${className ?? ""}`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-shelley-charcoal z-10" role="status" aria-label="Loading game">
            <div className="flex flex-col items-center gap-3">
              <span className="font-pixel text-[9px] text-shelley-amber animate-pulse crt-glow tracking-wider">
                LOADING
              </span>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-shelley-amber animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-shelley-charcoal z-10" role="alert">
            <div className="text-center px-4">
              <p className="font-pixel text-[8px] text-red-400 tracking-wider mb-2">
                {error.toUpperCase()}
              </p>
              <p className="text-white/30 text-xs">
                Game files will appear here once exported from Godot.
              </p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={`/games/${gameName}/index.html`}
          title={`${gameName.replace(/_/g, " ")} — interactive game`}
          className="w-full h-full border-none relative z-0"
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
