"use client";

import { useRef, useEffect } from "react";

// ─── EncounterNote ──────────────────────────────────────────────────────────
// Shared "do you want to talk to me?" note with yes/no checkboxes.
// Reused by PaperPlaneEncounter and ZoneDropEncounter.

interface EncounterNoteProps {
  position: { x: number; y: number };
  onAccept: () => void;
  onDismiss: () => void;
  variant?: "standard" | "spell";
}

// Ragged paper edge — pre-computed polygon vertices
const PAPER_CLIP_PATH = [
  "2% 1%",
  "12% 0%",
  "24% 2%",
  "38% 0%",
  "52% 1%",
  "65% 0%",
  "78% 2%",
  "89% 0%",
  "98% 1%",
  "100% 3%",
  "99% 15%",
  "100% 28%",
  "98% 42%",
  "100% 58%",
  "99% 72%",
  "100% 86%",
  "98% 97%",
  "96% 100%",
  "84% 99%",
  "70% 100%",
  "56% 98%",
  "42% 100%",
  "28% 99%",
  "14% 100%",
  "3% 98%",
  "0% 96%",
  "1% 82%",
  "0% 68%",
  "2% 54%",
  "0% 40%",
  "1% 26%",
  "0% 12%",
  "1% 4%",
].join(", ");

export default function EncounterNote({
  position,
  onAccept,
  onDismiss,
  variant = "standard",
}: EncounterNoteProps) {
  const yesRef = useRef<HTMLButtonElement>(null);

  // Auto-focus YES button on mount
  useEffect(() => {
    const timer = setTimeout(() => yesRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="encounter-note"
      role="dialog"
      aria-label="Po wants to talk"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: 200,
        minHeight: 120,
        zIndex: 55,
        clipPath: `polygon(${PAPER_CLIP_PATH})`,
        background: "#f5f0e8",
        border: "1px solid rgba(74, 55, 40, 0.3)",
        boxShadow: "2px 2px 6px rgba(0, 0, 0, 0.15)",
        padding: "20px 16px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        animation: "encounter-note-in 200ms ease-out both",
        pointerEvents: "auto",
      }}
    >
      {/* Question text */}
      {variant === "spell" ? (
        <p
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: 7,
            lineHeight: 1.8,
            color: "#ffbf00",
            textAlign: "center",
            letterSpacing: "0.03em",
            margin: 0,
            fontStyle: "italic",
            textShadow: "0 0 4px rgba(255, 191, 0, 0.3)",
          }}
        >
          a measure of Scratch&apos;s sun...
          <br />
          a pinch of Hendrix&apos;s truth...
          <br />
          dare you hear a Soul
          <br />
          at the White Heat?
        </p>
      ) : (
        <p
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: 8,
            lineHeight: 1.6,
            color: "#3a2e22",
            textAlign: "center",
            letterSpacing: "0.03em",
            margin: 0,
          }}
        >
          do you want to
          <br />
          talk to me?
        </p>
      )}

      {/* Checkbox buttons */}
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        {/* YES / ACCEPT */}
        <button
          ref={yesRef}
          onClick={onAccept}
          className="encounter-note-btn"
          aria-label={variant === "spell" ? "Accept the spell" : "Yes, talk to Po"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            padding: 2,
            cursor: "pointer",
            ...(variant === "spell" ? { filter: "drop-shadow(0 0 3px rgba(255, 191, 0, 0.5))" } : {}),
          }}
        >
          <span
            className="encounter-note-box"
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 12,
              height: 12,
              border: `1px solid ${variant === "spell" ? "#ffbf00" : "#4a3728"}`,
              background: "transparent",
              flexShrink: 0,
              transition: "background 150ms ease",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-pixel), monospace",
                fontSize: 8,
                lineHeight: 1,
                color: variant === "spell" ? "#ffbf00" : "#4a3728",
              }}
            >
              &#x2713;
            </span>
          </span>
          <span
            style={{
              fontFamily: "var(--font-pixel), monospace",
              fontSize: 7,
              color: variant === "spell" ? "#ffbf00" : "#4a3728",
              letterSpacing: "0.04em",
            }}
          >
            {variant === "spell" ? "dare" : "yes"}
          </span>
        </button>

        {/* NO / DISMISS */}
        <button
          onClick={onDismiss}
          className="encounter-note-btn"
          aria-label="No, dismiss"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            padding: 2,
            cursor: "pointer",
          }}
        >
          <span
            className="encounter-note-box"
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              border: "1px solid #4a3728",
              background: "transparent",
              flexShrink: 0,
              transition: "background 150ms ease",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-pixel), monospace",
              fontSize: 7,
              color: "#4a3728",
              letterSpacing: "0.04em",
            }}
          >
            no
          </span>
        </button>
      </div>
    </div>
  );
}
