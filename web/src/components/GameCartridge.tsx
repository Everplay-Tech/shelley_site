"use client";

import { useCallback } from "react";
import { useTransition } from "./TransitionContext";
import type { RouteGameConfig } from "@/lib/game-routes";

interface GameCartridgeProps {
  game: RouteGameConfig;
  /** Zone accent Tailwind text class (e.g. "text-shelley-amber") */
  accentColor: string;
  /** Zone accent hex for glow (e.g. "#ffbf00") */
  accentHex: string;
  className?: string;
}

export default function GameCartridge({
  game,
  accentColor,
  accentHex,
  className = "",
}: GameCartridgeProps) {
  const { replayGame } = useTransition();

  const handleOpen = useCallback(() => {
    replayGame(game);
  }, [game, replayGame]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
    },
    [handleOpen]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${game.label ?? game.gameName}`}
      className={`
        game-cartridge group cursor-pointer
        pixel-panel-raised max-w-xs mx-auto w-full
        transition-all active:translate-y-[1px]
        hover:translate-y-[-1px]
        ${className}
      `}
      style={{ "--cartridge-glow": accentHex } as React.CSSProperties}
    >
      {/* Cartridge body */}
      <div className="relative p-4 sm:p-5">
        {/* Top notch (cartridge shape) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[1px] w-10 h-1.5 bg-white/5 rounded-b-sm" />

        {/* Label area */}
        <div className="pixel-panel-inset p-3 sm:p-4 text-center">
          {/* Game title */}
          <p className={`font-pixel text-[8px] sm:text-[9px] ${accentColor} tracking-wider mb-2`}>
            {(game.label ?? game.gameName).replace(/\.\.\.$/, "").toUpperCase()}
          </p>

          {/* Play icon */}
          <div className="flex justify-center mb-2">
            <div
              className={`
                w-8 h-8 rounded-full border border-white/10
                flex items-center justify-center
                group-hover:border-white/25 transition-colors
              `}
              style={{ boxShadow: `0 0 8px ${accentHex}20` }}
            >
              {/* Play triangle */}
              <div
                className="w-0 h-0 ml-0.5
                  border-t-[5px] border-t-transparent
                  border-b-[5px] border-b-transparent
                  border-l-[8px] border-l-white/40
                  group-hover:border-l-white/70 transition-colors"
              />
            </div>
          </div>

          {/* Open label */}
          <p className="font-pixel text-[6px] text-white/20 tracking-widest group-hover:text-white/40 transition-colors">
            PLAY
          </p>
        </div>

        {/* Bottom connector pins */}
        <div className="flex justify-center gap-1 mt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-1 h-1 bg-white/5 rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
