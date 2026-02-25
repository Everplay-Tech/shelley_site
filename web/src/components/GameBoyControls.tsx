"use client";

import React, { useCallback } from "react";
import type { GodotCommand } from "@/lib/godot-messages";

interface GameBoyControlsProps {
  sendCommand: (cmd: GodotCommand) => void;
  isNarrative: boolean;
}

export default function GameBoyControls({
  sendCommand,
  isNarrative,
}: GameBoyControlsProps) {
  const onSlideStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      sendCommand({ command: "slide_press" });
    },
    [sendCommand]
  );

  const onSlideEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      sendCommand({ command: "slide_release" });
    },
    [sendCommand]
  );

  const onActionStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      sendCommand({ command: "jump_press" });
      if (isNarrative) {
        sendCommand({ command: "advance_press" });
      }
    },
    [sendCommand, isNarrative]
  );

  const onActionEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      sendCommand({ command: "jump_release" });
      if (isNarrative) {
        sendCommand({ command: "advance_release" });
      }
    },
    [sendCommand, isNarrative]
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-[103] pointer-events-none pb-6 px-6">
      <div className="flex items-end justify-between max-w-lg mx-auto">
        {/* Left: Slide button */}
        <button
          onTouchStart={onSlideStart}
          onTouchEnd={onSlideEnd}
          onTouchCancel={onSlideEnd}
          className="pointer-events-auto w-16 h-16 rounded-lg bg-[#2C2C2C]/80 border-2 border-white/15 flex items-center justify-center active:bg-[#2C2C2C] active:border-shelley-amber/50 active:scale-95 transition-all select-none touch-none"
        >
          <span className="text-white/60 text-2xl font-bold leading-none">
            ↓
          </span>
        </button>

        {/* Right: A button (jump / advance) */}
        <button
          onTouchStart={onActionStart}
          onTouchEnd={onActionEnd}
          onTouchCancel={onActionEnd}
          className="pointer-events-auto w-16 h-16 rounded-full bg-[#2C2C2C]/80 border-2 border-white/15 flex items-center justify-center active:bg-[#2C2C2C] active:border-shelley-amber/50 active:scale-95 transition-all select-none touch-none"
        >
          <span className="text-shelley-amber text-xl font-bold leading-none">
            A
          </span>
        </button>
      </div>
    </div>
  );
}
