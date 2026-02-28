"use client";

import { useMemo } from "react";

export type ParticleType = "sawdust" | "motes" | "sparkles" | "signals";

interface AmbientParticlesProps {
  type: ParticleType;
  count?: number;
  className?: string;
}

const BASE_DURATIONS: Record<ParticleType, number> = {
  sawdust: 12,
  motes: 14,
  sparkles: 5,
  signals: 3,
};

export default function AmbientParticles({
  type,
  count = 10,
  className = "",
}: AmbientParticlesProps) {
  const particles = useMemo(() => {
    const base = BASE_DURATIONS[type];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: type === "sparkles" ? `${Math.random() * 80 + 10}%` : undefined,
      animationDelay: `${Math.random() * base}s`,
      animationDuration: `${base + Math.random() * base * 0.6}s`,
    }));
  }, [count, type]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className={`zone-particle zone-particle-${type}`}
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
          }}
        />
      ))}
    </div>
  );
}
