"use client";

// ─── HomeMural — Panoramic Mural Viewer ────────────────────────────────────
// Data-driven mural sections, randomly shuffled on each mount.
// Vertical snap between murals, horizontal pan within each.
// Navigation away: Sidebar (always visible) + Codec (encounter system).

import { useEffect, useRef, useState } from "react";
import { getShuffledMurals, type MuralDef } from "@/lib/mural-config";
import MuralSection from "./mural/MuralSection";

export default function HomeMural() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [murals] = useState<MuralDef[]>(() => getShuffledMurals());
  const [activeIndex, setActiveIndex] = useState(0);

  // Track which section is in view via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sections = container.querySelectorAll(".mural-section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(sections).indexOf(entry.target as Element);
            if (idx >= 0) setActiveIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [murals]);

  return (
    <div className="mural-wrapper">
      {/* Section indicator — Hebrew numerals */}
      <div className="mural-indicator" aria-hidden="true">
        {murals.map((m, i) => (
          <button
            key={m.id}
            className={`mural-indicator-dot ${i === activeIndex ? "mural-indicator-dot--active" : ""}`}
            onClick={() => {
              containerRef.current
                ?.querySelectorAll(".mural-section")
                [i]?.scrollIntoView({ behavior: "smooth" });
            }}
            aria-label={`Scroll to mural ${m.hebrewNumeral}`}
          />
        ))}
      </div>

      {/* Scroll-snap container (vertical) */}
      <div ref={containerRef} className="mural-container">
        {murals.map((m) => (
          <MuralSection key={m.id} mural={m} />
        ))}
      </div>
    </div>
  );
}
