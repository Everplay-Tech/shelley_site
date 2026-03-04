"use client";

import React from "react";

type PointerDirection = "left" | "right" | "top" | "bottom";

interface SpeechBubbleProps {
  text: string;
  pointer?: PointerDirection;
  visible?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function SpeechBubble({
  text,
  pointer = "left",
  visible = true,
  onClick,
  className = "",
  style,
}: SpeechBubbleProps) {
  return (
    <div
      className={`speech-bubble speech-bubble--${pointer} ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        ...style,
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <span className="speech-bubble__text">{text}</span>
      <span className="speech-bubble__pointer" aria-hidden="true" />
    </div>
  );
}
