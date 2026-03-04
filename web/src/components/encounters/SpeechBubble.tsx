"use client";

import { forwardRef } from "react";

/* -----------------------------------------
   SpeechBubble -- reusable pixel-art speech bubble
   Used by KnockEncounter (T3) and CursorStalkEncounter (T7)
   ----------------------------------------- */

export type PointerDirection = "left" | "right" | "up" | "down";

export interface SpeechBubbleProps {
  text: string;
  position: { x: number; y: number };
  pointerDirection: PointerDirection;
  onClick: () => void;
  className?: string;
}

/**
 * CSS border-trick triangle: for each direction we set the appropriate
 * borders to transparent and the opposing border to the background color.
 * The pseudo-element is positioned on the edge the pointer extends from.
 */
function getPointerStyles(dir: PointerDirection): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    display: "block",
    width: 0,
    height: 0,
  };

  const size = 5; // px -- small pixel-art scale pointer

  switch (dir) {
    case "left":
      return {
        ...base,
        top: "50%",
        left: -size * 2,
        marginTop: -size,
        borderTop: `${size}px solid transparent`,
        borderBottom: `${size}px solid transparent`,
        borderRight: `${size * 2}px solid #1a1a1a`,
      };
    case "right":
      return {
        ...base,
        top: "50%",
        right: -size * 2,
        marginTop: -size,
        borderTop: `${size}px solid transparent`,
        borderBottom: `${size}px solid transparent`,
        borderLeft: `${size * 2}px solid #1a1a1a`,
      };
    case "up":
      return {
        ...base,
        left: "50%",
        top: -size * 2,
        marginLeft: -size,
        borderLeft: `${size}px solid transparent`,
        borderRight: `${size}px solid transparent`,
        borderBottom: `${size * 2}px solid #1a1a1a`,
      };
    case "down":
      return {
        ...base,
        left: "50%",
        bottom: -size * 2,
        marginLeft: -size,
        borderLeft: `${size}px solid transparent`,
        borderRight: `${size}px solid transparent`,
        borderTop: `${size * 2}px solid #1a1a1a`,
      };
  }
}

const SpeechBubble = forwardRef<HTMLButtonElement, SpeechBubbleProps>(
  function SpeechBubble({ text, position, pointerDirection, onClick, className = "" }, ref) {
    const pointerCSS = getPointerStyles(pointerDirection);

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={`Po says: ${text}`}
        className={`speech-bubble ${className}`}
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 45,
          background: "#1a1a1a",
          border: "1px solid rgba(255, 191, 0, 0.4)",
          padding: "6px 10px",
          cursor: "pointer",
          // reset button defaults
          outline: "none",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {/* Triangle pointer (CSS border trick) */}
        <span
          aria-hidden="true"
          style={pointerCSS}
        />

        <span
          className="font-pixel"
          style={{
            fontSize: "8px",
            color: "rgba(255, 255, 255, 0.7)",
            userSelect: "none",
          }}
        >
          {text}
        </span>
      </button>
    );
  }
);

export default SpeechBubble;
