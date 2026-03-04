"use client";

// ─── Triple Flux Capacitor ──────────────────────────────────────────────────
// Three Y-junction flux capacitors arranged in a triangle, linked by energy arcs.
// Pure SVG/CSS — visual centerpiece alternative for Codec V2.
//
// Structure:
//   - Central nexus: bright pulsing core
//   - Three flux arms at 120° intervals, each a Y-shape
//   - Each Y-tip has a glowing node
//   - Energy pulses travel along the arms toward the center
//   - Outer arc ring connecting the three node clusters
//   - Concentric energy rings around the central core

export default function TripleFlux({ className = "" }: { className?: string }) {
  // Three arms at 120° apart, starting from top
  // Arm endpoints (Y-tip nodes) at radius ~48 from center
  // Center of viewBox: 60, 75
  const cx = 60;
  const cy = 72;
  const armLen = 38;
  const forkLen = 14;
  const forkSpread = 12;

  // Arm angles: -90° (top), 30° (bottom-right), 150° (bottom-left)
  const arms = [
    { angle: -90, color: "#00fff2" },
    { angle: 30, color: "#ffbf00" },
    { angle: 150, color: "#e0f0ff" },
  ];

  function armGeometry(angleDeg: number) {
    const a = (angleDeg * Math.PI) / 180;
    // Main arm endpoint
    const ex = cx + armLen * Math.cos(a);
    const ey = cy + armLen * Math.sin(a);
    // Fork: two tips splitting from the arm end
    const perpA = a + Math.PI / 2;
    const fx1 = ex + forkLen * Math.cos(a) + forkSpread * Math.cos(perpA);
    const fy1 = ey + forkLen * Math.sin(a) + forkSpread * Math.sin(perpA);
    const fx2 = ex + forkLen * Math.cos(a) - forkSpread * Math.cos(perpA);
    const fy2 = ey + forkLen * Math.sin(a) - forkSpread * Math.sin(perpA);
    // Path from center to arm end
    const mainPath = `M${cx},${cy} L${ex},${ey}`;
    // Fork paths
    const fork1 = `M${ex},${ey} L${fx1},${fy1}`;
    const fork2 = `M${ex},${ey} L${fx2},${fy2}`;
    // Pulse path (center → fork tip 1, longer travel)
    const pulsePath = `M${cx},${cy} L${ex},${ey} L${fx1},${fy1}`;
    return { ex, ey, fx1, fy1, fx2, fy2, mainPath, fork1, fork2, pulsePath };
  }

  return (
    <div className={`triple-flux ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 120 150"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Central core glow */}
          <radialGradient id="tf-core-glow" cx="50%" cy="48%" r="25%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#ffbf00" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#00fff2" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00fff2" stopOpacity="0" />
          </radialGradient>

          {/* Node glow */}
          <radialGradient id="tf-node-cyan" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00fff2" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#00fff2" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00fff2" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="tf-node-amber" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffbf00" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#ffbf00" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffbf00" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="tf-node-white" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e0f0ff" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#e0f0ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#e0f0ff" stopOpacity="0" />
          </radialGradient>

          {/* Glow filter for the arms */}
          <filter id="tf-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Outer arc ring connecting the three arm clusters ── */}
        <circle
          cx={cx} cy={cy} r="52"
          fill="none"
          stroke="#00fff2"
          strokeWidth="0.3"
          strokeOpacity="0.1"
          strokeDasharray="3 5"
          className="tf-outer-ring"
        />
        <circle
          cx={cx} cy={cy} r="48"
          fill="none"
          stroke="#ffbf00"
          strokeWidth="0.3"
          strokeOpacity="0.08"
          strokeDasharray="2 6"
          className="tf-outer-ring-2"
        />

        {/* ── Three flux arms ── */}
        {arms.map((arm, i) => {
          const g = armGeometry(arm.angle);
          const nodeGrad = i === 0 ? "url(#tf-node-cyan)" : i === 1 ? "url(#tf-node-amber)" : "url(#tf-node-white)";
          return (
            <g key={i} filter="url(#tf-glow)">
              {/* Main arm line */}
              <path
                d={g.mainPath}
                stroke={arm.color}
                strokeWidth="1.5"
                strokeOpacity="0.4"
                fill="none"
              />
              {/* Fork lines */}
              <path d={g.fork1} stroke={arm.color} strokeWidth="1" strokeOpacity="0.35" fill="none" />
              <path d={g.fork2} stroke={arm.color} strokeWidth="1" strokeOpacity="0.35" fill="none" />

              {/* Junction node (where arm meets fork) */}
              <circle cx={g.ex} cy={g.ey} r="2.5" fill={arm.color} fillOpacity="0.5" />

              {/* Fork tip nodes */}
              <circle cx={g.fx1} cy={g.fy1} r="3" fill={nodeGrad} />
              <circle cx={g.fx2} cy={g.fy2} r="3" fill={nodeGrad} />
              {/* Bright center of tip nodes */}
              <circle cx={g.fx1} cy={g.fy1} r="1" fill="white" fillOpacity="0.7" />
              <circle cx={g.fx2} cy={g.fy2} r="1" fill="white" fillOpacity="0.7" />

              {/* Energy pulse traveling along arm → fork */}
              <circle r="1.5" fill={arm.color} fillOpacity="0.9" className={`tf-pulse tf-pulse-${i + 1}`}>
                <animateMotion
                  dur={`${2.5 + i * 0.4}s`}
                  repeatCount="indefinite"
                  path={g.pulsePath}
                />
              </circle>
              {/* Second pulse on the other fork, offset */}
              <circle r="1.2" fill={arm.color} fillOpacity="0.7" className={`tf-pulse tf-pulse-${i + 1}b`}>
                <animateMotion
                  dur={`${2.8 + i * 0.3}s`}
                  repeatCount="indefinite"
                  path={`M${cx},${cy} L${g.ex},${g.ey} L${g.fx2},${g.fy2}`}
                />
              </circle>
            </g>
          );
        })}

        {/* ── Concentric energy rings around core ── */}
        <circle
          cx={cx} cy={cy} r="8"
          fill="none"
          stroke="#ffbf00"
          strokeWidth="0.5"
          strokeOpacity="0.2"
          className="tf-inner-ring tf-inner-ring-1"
        />
        <circle
          cx={cx} cy={cy} r="13"
          fill="none"
          stroke="#00fff2"
          strokeWidth="0.4"
          strokeOpacity="0.15"
          className="tf-inner-ring tf-inner-ring-2"
        />
        <circle
          cx={cx} cy={cy} r="18"
          fill="none"
          stroke="#e0f0ff"
          strokeWidth="0.3"
          strokeOpacity="0.1"
          className="tf-inner-ring tf-inner-ring-3"
        />

        {/* ── Central nexus core ── */}
        <circle cx={cx} cy={cy} r="12" fill="url(#tf-core-glow)" className="tf-core" />
        <circle cx={cx} cy={cy} r="4" fill="#ffbf00" fillOpacity="0.6" className="tf-core-bright" />
        <circle cx={cx} cy={cy} r="1.5" fill="white" fillOpacity="0.9" />

        {/* ── "FLUX" label below ── */}
        <text
          x={cx}
          y="142"
          textAnchor="middle"
          fontSize="5"
          fill="#ffbf00"
          fillOpacity="0.25"
          style={{ fontFamily: "var(--font-pixel)" }}
          letterSpacing="3"
        >
          FLUX
        </text>
      </svg>
    </div>
  );
}
