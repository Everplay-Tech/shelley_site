"use client";

import { useEffect, useRef } from "react";
import type { MuralDef } from "@/lib/mural-config";

interface Props {
  mural: MuralDef;
}

export default function MuralSection({ mural }: Props) {
  const panRef = useRef<HTMLDivElement>(null);

  // Center the image horizontally on mount
  useEffect(() => {
    const el = panRef.current;
    if (!el) return;
    const img = el.querySelector("img");
    const center = () => {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    };
    if (img?.complete) center();
    else img?.addEventListener("load", center, { once: true });
  }, []);

  // Route horizontal wheel/trackpad to pan viewport
  useEffect(() => {
    const pan = panRef.current;
    if (!pan) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        pan.scrollLeft += e.deltaX;
      }
    };

    pan.addEventListener("wheel", handleWheel, { passive: false });
    return () => pan.removeEventListener("wheel", handleWheel);
  }, []);

  // Touch: lock direction after first significant move
  useEffect(() => {
    const pan = panRef.current;
    if (!pan) return;

    let startX = 0;
    let startY = 0;
    let locked: "x" | "y" | null = null;

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      locked = null;
    };

    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      if (!locked) {
        // Need enough movement to determine direction
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }

      if (locked === "x") {
        // Horizontal: prevent vertical scroll, pan manually
        e.preventDefault();
        pan.scrollLeft -= (e.touches[0].clientX - startX);
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      // locked === "y": let it propagate to parent for snap scroll
    };

    pan.addEventListener("touchstart", onStart, { passive: true });
    pan.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      pan.removeEventListener("touchstart", onStart);
      pan.removeEventListener("touchmove", onMove);
    };
  }, []);

  return (
    <section className={`mural-section mural-${mural.variant}`}>
      {/* Ambient overlays driven by variant */}
      {mural.variant === "cave" && <div className="mural-torch-glow" />}
      {mural.variant === "ceiling" && <div className="mural-gold-shimmer" />}
      {mural.variant === "scroll" && (
        <>
          <div className="mural-mist mural-mist-far" />
          <div className="mural-mist mural-mist-near" />
        </>
      )}

      {/* Hebrew numeral — subtle top-left */}
      <div className="mural-numeral">
        <span>{mural.hebrewNumeral}</span>
      </div>

      {/* Horizontal pan viewport */}
      <div ref={panRef} className="mural-pan">
        <img
          src={mural.image}
          alt={mural.alt}
          className="mural-pan-img"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Edge fades */}
      <div className="mural-section-fade-bottom" />
    </section>
  );
}
