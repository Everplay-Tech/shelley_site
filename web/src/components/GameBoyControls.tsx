"use client";

import React, { useCallback } from "react";
import type { GodotCommand } from "@/lib/godot-messages";

interface GameBoyControlsProps {
  sendCommand: (cmd: GodotCommand) => void;
  isNarrative: boolean;
}

/**
 * Full Game Boy Color-style controller overlay.
 * D-pad on the left, A/B buttons on the right.
 * Down (slide), A (jump/advance), B (slide) are functional.
 * Up/Left/Right are visual — future expansion.
 */
export default function GameBoyControls({
  sendCommand,
  isNarrative,
}: GameBoyControlsProps) {
  // ─── D-pad Down = Slide ───
  const onDpadDownStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      sendCommand({ command: "slide_press" });
    },
    [sendCommand]
  );
  const onDpadDownEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      sendCommand({ command: "slide_release" });
    },
    [sendCommand]
  );

  // ─── A Button = Jump (+ Advance during narrative) ───
  const onAStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      sendCommand({ command: "jump_press" });
      if (isNarrative) sendCommand({ command: "advance_press" });
    },
    [sendCommand, isNarrative]
  );
  const onAEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      sendCommand({ command: "jump_release" });
      if (isNarrative) sendCommand({ command: "advance_release" });
    },
    [sendCommand, isNarrative]
  );

  // ─── B Button = Slide ───
  const onBStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      sendCommand({ command: "slide_press" });
    },
    [sendCommand]
  );
  const onBEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      sendCommand({ command: "slide_release" });
    },
    [sendCommand]
  );

  const dpadBtnBase =
    "flex items-center justify-center select-none touch-none";
  const dpadInert = `${dpadBtnBase} text-white/15`;
  const dpadActive = `${dpadBtnBase} pointer-events-auto active:bg-white/10 rounded transition-colors text-white/50`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[103] pointer-events-none pb-4 px-4 sm:pb-6 sm:px-6">
      <div className="flex items-end justify-between max-w-lg mx-auto">
        {/* ─── D-PAD ─── */}
        <div className="relative w-[112px] h-[112px]">
          {/* Cross shape background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[38px] h-[104px] bg-[#1a1a1a]/70 rounded-[4px]" />
            <div className="absolute w-[104px] h-[38px] bg-[#1a1a1a]/70 rounded-[4px]" />
          </div>

          {/* Up — visual only */}
          <div
            className={`absolute top-[4px] left-1/2 -translate-x-1/2 w-[38px] h-[33px] ${dpadInert}`}
          >
            <span className="text-sm font-bold">▲</span>
          </div>

          {/* Left — visual only */}
          <div
            className={`absolute top-1/2 left-[4px] -translate-y-1/2 w-[33px] h-[38px] ${dpadInert}`}
          >
            <span className="text-sm font-bold">◀</span>
          </div>

          {/* Right — visual only */}
          <div
            className={`absolute top-1/2 right-[4px] -translate-y-1/2 w-[33px] h-[38px] ${dpadInert}`}
          >
            <span className="text-sm font-bold">▶</span>
          </div>

          {/* Down — FUNCTIONAL (slide) */}
          <button
            onTouchStart={onDpadDownStart}
            onTouchEnd={onDpadDownEnd}
            onTouchCancel={onDpadDownEnd}
            className={`absolute bottom-[4px] left-1/2 -translate-x-1/2 w-[38px] h-[33px] ${dpadActive}`}
          >
            <span className="text-sm font-bold">▼</span>
          </button>

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-white/8 pointer-events-none" />
        </div>

        {/* ─── A / B BUTTONS ─── */}
        <div className="relative w-[120px] h-[100px]">
          {/* B button — top-left (slide) */}
          <button
            onTouchStart={onBStart}
            onTouchEnd={onBEnd}
            onTouchCancel={onBEnd}
            className="pointer-events-auto absolute top-0 left-0 w-[52px] h-[52px] rounded-full bg-[#2C2C2C]/80 border-2 border-white/15 flex items-center justify-center active:bg-[#3a3a3a] active:border-white/30 active:scale-95 transition-all select-none touch-none"
          >
            <span className="text-white/40 text-base font-bold leading-none">
              B
            </span>
          </button>

          {/* A button — bottom-right (jump / advance) */}
          <button
            onTouchStart={onAStart}
            onTouchEnd={onAEnd}
            onTouchCancel={onAEnd}
            className="pointer-events-auto absolute bottom-0 right-0 w-[52px] h-[52px] rounded-full bg-[#2C2C2C]/80 border-2 border-shelley-amber/30 flex items-center justify-center active:bg-[#3a3a3a] active:border-shelley-amber/60 active:scale-95 transition-all select-none touch-none"
          >
            <span className="text-shelley-amber text-base font-bold leading-none">
              A
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
