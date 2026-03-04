"use client";

// ─── Codec V2 — Three-Panel MGS-Inspired Layout ────────────────────────────
// Left: Po portrait (large, green CRT tint)
// Center: Crystal Bonsai OR Triple Flux Capacitor (random per open)
// Right: Dossier pentagon chart
// Bottom: Dialogue with typewriter (preserved from V1)

import { useState, useEffect, useRef, useCallback } from "react";
import { useCodecOverlay } from "@/hooks/useCodecOverlay";
import { getCodecScript, type CodecLine } from "@/lib/codec-content";
import { PO_COSTUMES } from "@/lib/zone-config";
import PoZoneAnimation from "./PoZoneAnimation";
import CrystalBonsai from "./CrystalBonsai";
import TripleFlux from "./TripleFlux";
import PoDossier from "./PoDossier";

type ArtifactType = "bonsai" | "flux";

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
  const [artifact, setArtifact] = useState<ArtifactType>("bonsai");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Load script + randomize center artifact when opening
  useEffect(() => {
    if (!isOpen) return;
    const context = getCodecContext(zoneId);
    const script = getCodecScript(context);
    setLines(script.lines);
    setLineIndex(0);
    setClosing(false);
    setArtifact(Math.random() < 0.5 ? "bonsai" : "flux");
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
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }
    return () => {
      if (!isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // ESC to close + focus trap
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
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
      className="fixed inset-0 z-[60] flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Dialog window — wider for three panels */}
      <div
        className={`relative max-w-[800px] w-full mx-4 codec-window ${
          closing ? "codec-window-exit" : "codec-window-enter"
        }`}
      >
        {/* Scanlines — tight 1px gap inside dialog */}
        <div
          className="absolute inset-0 pointer-events-none z-[1] rounded-sm codec-v2-scanlines"
          aria-hidden="true"
        />

        {/* Title bar */}
        <div className="codec-titlebar relative z-10">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[7px] text-shelley-amber/60 tracking-[0.2em]">
              CODEC
            </span>
            <div className="hidden sm:block h-px flex-1 max-w-[100px] bg-shelley-amber/10" />
            <span className="hidden sm:block font-pixel text-[5px] text-white/15 tracking-[0.15em]">
              v2.0
            </span>
          </div>
          <button
            ref={closeBtnRef}
            onClick={handleClose}
            className="font-pixel text-[7px] text-white/30 hover:text-shelley-amber/80 transition-colors px-1.5 py-0.5 border border-white/10 hover:border-shelley-amber/30"
            aria-label="Close codec dialogue (Escape)"
          >
            &#x2715;
          </button>
        </div>

        {/* ── Three-panel area (desktop) ── */}
        <div className="relative z-10 p-3 sm:p-4">
          <div className="codec-v2-panels">
            {/* LEFT: Po Portrait (large, green CRT) */}
            <div className="codec-portrait-frame">
              <div className="codec-portrait-inner">
                {/* Dark inset background */}
                <div className="absolute inset-0 bg-black/50" />
                {/* Green CRT tint wrapper */}
                <div className="codec-portrait-crt">
                  {costumeConfig.portrait ? (
                    <img
                      src={costumeConfig.portrait}
                      alt={`${costumeConfig.label} portrait`}
                      width={200}
                      height={200}
                      className="w-[200px] h-[200px] object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    <PoZoneAnimation costume={costume} size={200} />
                  )}
                </div>
                {/* Tight scanlines over portrait */}
                <div className="absolute inset-0 pointer-events-none codec-portrait-scanlines" />
              </div>
              {/* Label */}
              <p className="font-pixel text-[6px] text-shelley-amber/50 tracking-[0.2em] mt-1.5 text-center">
                {costumeConfig.label.toUpperCase()}
              </p>
            </div>

            {/* CENTER: Crystal Bonsai or Triple Flux (hidden on mobile) */}
            <div className="codec-artifact-frame hidden sm:flex">
              {artifact === "flux" ? (
                <TripleFlux className="w-full h-full" />
              ) : (
                <CrystalBonsai className="w-full h-full" />
              )}
            </div>

            {/* RIGHT: Dossier/Stats (hidden on mobile) */}
            <div className="codec-dossier-frame hidden sm:block">
              <PoDossier zoneId={zoneId} />
            </div>
          </div>

          {/* ── Dialogue area (full width, below panels) ── */}
          <div className="codec-v2-dialogue mt-3">
            {/* Dialogue scan sweep */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm">
              <div className="codec-dialogue-sweep" aria-hidden="true" />
            </div>

            {/* Speaker label */}
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <span className="font-pixel text-[8px] text-shelley-amber crt-glow tracking-wider">
                {currentLine?.speaker ?? "PO"}
              </span>
              <div className="flex-1 h-px bg-shelley-amber/10" />
            </div>

            {/* Dialogue text with typewriter */}
            <div
              role="log"
              aria-live="polite"
              className="min-h-[48px] sm:min-h-[56px] mb-3 relative z-10"
            >
              <p className="font-pixel text-[7px] sm:text-[8px] text-white/60 leading-[2]">
                {displayedText}
                {showCursor && (
                  <span className="inline-block w-[5px] h-[10px] bg-shelley-amber/70 ml-[1px] animate-blink-cursor align-middle" />
                )}
              </p>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center relative z-10">
              <span className="font-pixel text-[5px] text-white/15 tracking-widest">
                {lineIndex + 1}/{lines.length}
              </span>
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
    </div>
  );
}
