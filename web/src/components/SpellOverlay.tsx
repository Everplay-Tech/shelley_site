"use client";

import { useEffect, useCallback } from "react";

// ─── The Spell ──────────────────────────────────────────────────────────────
// Each line materializes individually with staggered delay.
const SPELL_LINES = [
  "I am the flaming sun, and music is my flaming god —",
  "so spoke the Upsetter, baptizing the signal in dub smoke.",
  "",
  "Now gather what burns.",
  "",
  "Take one who moves by forcing his will on unsuspecting air molecules,",
  "and another who declared: The hell with the rules —",
  "if it sounds right, then it is.",
  "",
  "Measure out a worker in rhythms, frequencies, and intensities,",
  "and fold him into the one — give me the one,",
  "you can do all those other things.",
  "",
  "You are not even its maker, the Purple one warned.",
  "You're just there to bring it forth.",
  "",
  "Good. Let it use you.",
  "",
  "If you feel safe in the area that you're working in,",
  "you're not working in the right area.",
  "",
  "Steep these together:",
  "All I play is truth and emotion,",
  "and from the quietest mouth in the room —",
  "Yeah, but I'm screaming inside.",
  "",
  "Let the Flaming Sun move through it again.",
  "",
  "Now dream the impossible part:",
  "write a track in my sleep, wake up and write it in the real world —",
  "while somewhere a tape hisses backward,",
  "inventing a past that didn't really happen.",
  "",
  "Stir with the hands of Parker, Benedetto, Somogyi —",
  "luthiers whose wood remembers what fingers forget.",
  "",
  "Light the flame with the Rebbe's spark.",
  "",
  "Dare you see a Soul at the White Heat?",
];

const LINE_DELAY_MS = 120; // stagger between each line
const FADE_OUT_MS = 600;

interface SpellOverlayProps {
  onDismiss: () => void;
}

export default function SpellOverlay({ onDismiss }: SpellOverlayProps) {
  // Dismiss on any key or click
  const handleDismiss = useCallback(() => {
    // Trigger fade-out, then call onDismiss
    const el = document.getElementById("spell-overlay");
    if (el) {
      el.style.opacity = "0";
      el.style.transition = `opacity ${FADE_OUT_MS}ms ease-out`;
      setTimeout(onDismiss, FADE_OUT_MS);
    } else {
      onDismiss();
    }
  }, [onDismiss]);

  // Dismiss listeners — armed after 500ms to prevent instant dismissal
  useEffect(() => {
    let armed = false;
    const armTimer = setTimeout(() => {
      armed = true;
    }, 500);

    const onKey = () => {
      if (armed) handleDismiss();
    };
    const onClick = () => {
      if (armed) handleDismiss();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);

    return () => {
      clearTimeout(armTimer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [handleDismiss]);

  return (
    <div
      id="spell-overlay"
      className="spell-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: 1,
      }}
      role="dialog"
      aria-label="The Shelley Spell"
      aria-modal="true"
    >
      <div
        style={{
          maxWidth: 640,
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          padding: "2rem 1.5rem",
        }}
      >
        {SPELL_LINES.map((line, i) => {
          if (line === "") {
            return (
              <div
                key={i}
                className="spell-line"
                style={{
                  height: "1em",
                  animationDelay: `${i * LINE_DELAY_MS}ms`,
                }}
              />
            );
          }
          return (
            <p
              key={i}
              className="spell-line"
              style={{
                fontFamily: "var(--font-pixel), monospace",
                fontSize: "0.55rem",
                lineHeight: 2.2,
                color: "#ffbf00",
                margin: 0,
                animationDelay: `${i * LINE_DELAY_MS}ms`,
                letterSpacing: "0.02em",
              }}
            >
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
}
