"use client";

// ─── Crystal Bonsai Artifact ────────────────────────────────────────────────
// Pure CSS/SVG crystalline bonsai tree with atomic orbital rings.
// Visual centerpiece of the Codec V2 — no data, just energy.

export default function CrystalBonsai({ className = "" }: { className?: string }) {
  return (
    <div className={`crystal-bonsai ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 120 150"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="crystal-bonsai-svg"
      >
        <defs>
          {/* Base glow */}
          <radialGradient id="cb-base-glow" cx="50%" cy="85%" r="40%">
            <stop offset="0%" stopColor="#00fff2" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00fff2" stopOpacity="0" />
          </radialGradient>

          {/* Branch tip glow */}
          <radialGradient id="cb-tip-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffbf00" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#ffbf00" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffbf00" stopOpacity="0" />
          </radialGradient>

          {/* Crystal shimmer */}
          <linearGradient id="cb-crystal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f0ff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#00fff2" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e0f0ff" stopOpacity="0.4" />
          </linearGradient>

          {/* Trunk gradient */}
          <linearGradient id="cb-trunk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f0ff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#00fff2" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#e0f0ff" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Base glow emanation */}
        <ellipse cx="60" cy="130" rx="35" ry="12" fill="url(#cb-base-glow)" />

        {/* ── Trunk: jagged crystal segments ── */}
        <polygon
          points="56,130 52,110 55,95 53,80 57,65 60,60 63,65 67,80 65,95 68,110 64,130"
          fill="url(#cb-trunk)"
          stroke="#00fff2"
          strokeWidth="0.5"
          strokeOpacity="0.4"
        />
        {/* Inner facet line */}
        <line x1="60" y1="60" x2="60" y2="130" stroke="#e0f0ff" strokeWidth="0.3" strokeOpacity="0.3" />

        {/* ── Branch 1: upper-left ── */}
        <polygon
          points="53,80 40,62 37,58 42,56 48,64 55,75"
          fill="url(#cb-crystal)"
          stroke="#00fff2"
          strokeWidth="0.4"
          strokeOpacity="0.3"
        />
        {/* Tip glow */}
        <circle cx="39" cy="57" r="3" fill="url(#cb-tip-glow)" />

        {/* ── Branch 2: upper-right ── */}
        <polygon
          points="67,80 80,65 84,60 82,57 76,62 65,75"
          fill="url(#cb-crystal)"
          stroke="#00fff2"
          strokeWidth="0.4"
          strokeOpacity="0.3"
        />
        <circle cx="83" cy="58" r="3" fill="url(#cb-tip-glow)" />

        {/* ── Branch 3: mid-left ── */}
        <polygon
          points="52,95 35,85 30,82 33,79 40,83 55,90"
          fill="url(#cb-crystal)"
          stroke="#00fff2"
          strokeWidth="0.4"
          strokeOpacity="0.3"
        />
        <circle cx="31" cy="80" r="2.5" fill="url(#cb-tip-glow)" />

        {/* ── Branch 4: top crown ── */}
        <polygon
          points="57,65 55,48 53,42 57,38 60,35 63,38 67,42 65,48 63,65"
          fill="url(#cb-crystal)"
          stroke="#00fff2"
          strokeWidth="0.4"
          strokeOpacity="0.3"
        />
        <circle cx="60" cy="36" r="3.5" fill="url(#cb-tip-glow)" />

        {/* ── Atomic orbital ring 1 (slow, wide) ── */}
        <ellipse
          cx="60"
          cy="75"
          rx="45"
          ry="14"
          fill="none"
          stroke="#00fff2"
          strokeWidth="0.5"
          strokeOpacity="0.2"
          className="crystal-orbit crystal-orbit-1"
        />
        {/* Energy particle on orbit 1 */}
        <circle r="2" fill="#00fff2" fillOpacity="0.8" className="crystal-particle crystal-particle-1">
          <animateMotion
            dur="16s"
            repeatCount="indefinite"
            path="M105,75 A45,14 0 1,1 15,75 A45,14 0 1,1 105,75"
          />
        </circle>

        {/* ── Atomic orbital ring 2 (tilted, medium) ── */}
        <ellipse
          cx="60"
          cy="70"
          rx="32"
          ry="10"
          fill="none"
          stroke="#e0f0ff"
          strokeWidth="0.5"
          strokeOpacity="0.15"
          transform="rotate(-25 60 70)"
          className="crystal-orbit crystal-orbit-2"
        />
        <circle r="1.5" fill="#e0f0ff" fillOpacity="0.7" className="crystal-particle crystal-particle-2">
          <animateMotion
            dur="12s"
            repeatCount="indefinite"
            path="M92,70 A32,10 0 1,1 28,70 A32,10 0 1,1 92,70"
          />
        </circle>

        {/* ── Atomic orbital ring 3 (tight, fast) ── */}
        <ellipse
          cx="60"
          cy="65"
          rx="22"
          ry="8"
          fill="none"
          stroke="#ffbf00"
          strokeWidth="0.4"
          strokeOpacity="0.15"
          transform="rotate(30 60 65)"
          className="crystal-orbit crystal-orbit-3"
        />
        <circle r="1.5" fill="#ffbf00" fillOpacity="0.6" className="crystal-particle crystal-particle-3">
          <animateMotion
            dur="8s"
            repeatCount="indefinite"
            path="M82,65 A22,8 0 1,1 38,65 A22,8 0 1,1 82,65"
          />
        </circle>

        {/* Small crystal shards at base */}
        <polygon points="48,130 45,122 50,125" fill="#e0f0ff" fillOpacity="0.2" />
        <polygon points="72,130 75,124 70,126" fill="#e0f0ff" fillOpacity="0.15" />
        <polygon points="55,132 52,126 57,128" fill="#00fff2" fillOpacity="0.1" />
      </svg>
    </div>
  );
}
