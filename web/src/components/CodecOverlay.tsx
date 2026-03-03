"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useCodecOverlay } from "@/hooks/useCodecOverlay";
import { getCodecScript, type CodecLine } from "@/lib/codec-content";
import { PO_COSTUMES } from "@/lib/zone-config";
import PoZoneAnimation from "./PoZoneAnimation";

// Read context from cookies (lightweight, no server round-trip)
function getCodecContext(zoneId: ReturnType<typeof useCodecOverlay>["zoneId"]) {
  let visitCount = 0;
  let piecesCollected = 0;
  let onboardingComplete = false;

  if (typeof document !== "undefined") {
    const cookies = document.cookie;
    onboardingComplete = cookies.includes("shelley_onboarded=");

    // Zone visit tracking — increment on each codec open
    const visitKey = zoneId ? `zone_visits_${zoneId}` : "site_visits";
    try {
      const stored = sessionStorage.getItem(visitKey);
      visitCount = stored ? parseInt(stored, 10) : 0;
      sessionStorage.setItem(visitKey, String(visitCount + 1));
    } catch {
      // SSR or storage unavailable
    }

    // Pieces collected from cookie
    const pieceMatch = cookies.match(/pieces_collected=(\d+)/);
    if (pieceMatch) piecesCollected = parseInt(pieceMatch[1], 10);
  }

  return { zoneId, visitCount, piecesCollected, onboardingComplete };
}

export default function CodecOverlay() {
  const { isOpen, costume, zoneId, closeCodec } = useCodecOverlay();
  const [lines, setLines] = useState<CodecLine[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [closing, setClosing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Load script when opening
  useEffect(() => {
    if (!isOpen) return;
    const context = getCodecContext(zoneId);
    const script = getCodecScript(context);
    setLines(script.lines);
    setLineIndex(0);
    setClosing(false);
  }, [isOpen, zoneId]);

  // Typewriter effect
  useEffect(() => {
    if (!isOpen || lines.length === 0) return;
    const currentLine = lines[lineIndex];
    if (!currentLine) return;

    setDisplayedText("");
    setShowCursor(true);
    let i = 0;

    intervalRef.current = setInterval(() => {
      i++;
      if (i <= currentLine.text.length) {
        setDisplayedText(currentLine.text.slice(0, i));
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => setShowCursor(false), 1000);
      }
    }, 30);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, lines, lineIndex]);

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Delay to let animation start
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }
    return () => {
      if (!isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
      // Focus trap: Tab wrapping
      if (e.key === "Tab" && overlayRef.current) {
        const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
          'button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      closeCodec();
      setClosing(false);
    }, 200);
  }, [closeCodec]);

  const handleAdvance = useCallback(() => {
    // If typewriter still going, skip to end
    if (displayedText.length < (lines[lineIndex]?.text.length ?? 0)) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayedText(lines[lineIndex].text);
      setShowCursor(false);
      return;
    }
    // Advance to next line
    if (lineIndex < lines.length - 1) {
      setLineIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  }, [displayedText, lines, lineIndex, handleClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose]
  );

  if (!isOpen && !closing) return null;

  const currentLine = lines[lineIndex];
  const isLastLine = lineIndex >= lines.length - 1;
  const isTyping = displayedText.length < (currentLine?.text.length ?? 0);
  const costumeConfig = PO_COSTUMES[costume];

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Po codec dialogue"
      className={`fixed inset-0 z-[60] ${closing ? "codec-overlay-exit" : "codec-overlay-enter"}`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)",
        }}
        aria-hidden="true"
      />

      {/* Codec frame */}
      <div className="relative z-10 h-full flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Top bar */}
          <div className="flex justify-between items-center mb-4">
            <span className="font-pixel text-[7px] text-white/20 tracking-widest">
              CODEC
            </span>
            <button
              ref={closeBtnRef}
              onClick={handleClose}
              className="pixel-btn-ghost text-[7px]"
              aria-label="Close codec dialogue (Escape)"
            >
              CLOSE
            </button>
          </div>

          {/* Main content */}
          <div className="pixel-panel p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {/* Portrait */}
              <div className="shrink-0 text-center">
                <div className="relative w-[96px] h-[96px] sm:w-[120px] sm:h-[120px] pixel-panel-inset flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative">
                    <PoZoneAnimation costume={costume} size={96} />
                  </div>
                  {/* Portrait scanlines */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.12) 1px, rgba(0,0,0,0.12) 2px)",
                    }}
                    aria-hidden="true"
                  />
                </div>
                <p className="font-pixel text-[6px] text-shelley-amber/50 tracking-widest mt-2">
                  {costumeConfig.label.toUpperCase()}
                </p>
              </div>

              {/* Dialogue */}
              <div className="flex-1 min-w-0 w-full">
                {/* Speaker label */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-pixel text-[8px] text-shelley-amber crt-glow tracking-wider">
                    {currentLine?.speaker ?? "PO"}
                  </span>
                  <div className="flex-1 h-px bg-shelley-amber/10" />
                </div>

                {/* Dialogue text with typewriter */}
                <div
                  role="log"
                  aria-live="polite"
                  className="min-h-[60px] sm:min-h-[80px] mb-4"
                >
                  <p className="font-pixel text-[7px] sm:text-[8px] text-white/60 leading-[2]">
                    {displayedText}
                    {showCursor && (
                      <span className="inline-block w-[5px] h-[10px] bg-shelley-amber/70 ml-[1px] animate-blink-cursor align-middle" />
                    )}
                  </p>
                </div>

                {/* Advance / close button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleAdvance}
                    className="pixel-btn-ghost text-[7px]"
                  >
                    {isTyping ? "SKIP \u25B6" : isLastLine ? "CLOSE" : "NEXT \u25B6"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex justify-between items-center mt-3 px-1">
            <span className="font-pixel text-[5px] text-white/10 tracking-widest">
              {lineIndex + 1}/{lines.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
