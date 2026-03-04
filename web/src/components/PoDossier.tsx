"use client";

// ─── Po Dossier Panel ───────────────────────────────────────────────────────
// Pentagon stat chart + zone intel. Pure SVG, no chart library.
// Stats are hardcoded placeholders — real data pipeline comes later.

import type { ZoneId } from "@/lib/zone-config";
import { ZONES } from "@/lib/zone-config";

interface DossierStats {
  craft: number;   // 0-1
  lore: number;
  signal: number;
  spirit: number;
  style: number;
}

interface PoDossierProps {
  zoneId: ZoneId | null;
  stats?: DossierStats;
  className?: string;
}

const DEFAULT_STATS: DossierStats = {
  craft: 0.7,
  lore: 0.4,
  signal: 0.6,
  spirit: 0.3,
  style: 0.8,
};

const AXES = ["CRAFT", "LORE", "SIGNAL", "SPIRIT", "STYLE"] as const;

// Pentagon math: 5 vertices equally spaced, starting from top
function pentagonPoint(index: number, radius: number, cx: number, cy: number): [number, number] {
  const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function pentagonPoints(radius: number, cx: number, cy: number): string {
  return Array.from({ length: 5 }, (_, i) => pentagonPoint(i, radius, cx, cy).join(",")).join(" ");
}

function statPolygonPoints(stats: DossierStats, maxRadius: number, cx: number, cy: number): string {
  const values = [stats.craft, stats.lore, stats.signal, stats.spirit, stats.style];
  return values
    .map((v, i) => {
      const r = maxRadius * Math.max(v, 0.05); // minimum visible
      return pentagonPoint(i, r, cx, cy).join(",");
    })
    .join(" ");
}

// Label positions — pushed slightly outward from vertices
type TextAnchor = "start" | "middle" | "end";

function labelPosition(index: number, radius: number, cx: number, cy: number): { x: number; y: number; anchor: TextAnchor } {
  const [px, py] = pentagonPoint(index, radius + 10, cx, cy);
  let anchor: TextAnchor = "middle";
  if (px < cx - 5) anchor = "end";
  if (px > cx + 5) anchor = "start";
  return { x: px, y: py, anchor };
}

export default function PoDossier({ zoneId, stats, className = "" }: PoDossierProps) {
  const s = stats ?? DEFAULT_STATS;
  const zone = zoneId ? ZONES[zoneId] : null;
  const cx = 65;
  const cy = 60;
  const maxR = 38;

  // Read lightweight context from cookies
  let visitCount = 0;
  let piecesCollected = 0;
  if (typeof document !== "undefined") {
    try {
      const key = zoneId ? `zone_visits_${zoneId}` : "site_visits";
      const stored = sessionStorage.getItem(key);
      visitCount = stored ? parseInt(stored, 10) : 0;
    } catch { /* SSR */ }
    const pieceMatch = document.cookie.match(/pieces_collected=(\d+)/);
    if (pieceMatch) piecesCollected = parseInt(pieceMatch[1], 10);
  }

  return (
    <div className={`codec-dossier ${className}`}>
      {/* Header */}
      <div className="font-pixel text-[7px] tracking-[0.2em] text-green-400/70 mb-2 px-1">
        ZONE INTEL
      </div>

      {/* Pentagon chart */}
      <svg viewBox="0 0 130 120" width="100%" className="codec-dossier-chart">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1.0].map((scale) => (
          <polygon
            key={scale}
            points={pentagonPoints(maxR * scale, cx, cy)}
            fill="none"
            stroke="white"
            strokeOpacity={0.08}
            strokeWidth="0.5"
          />
        ))}

        {/* Axis lines */}
        {Array.from({ length: 5 }, (_, i) => {
          const [px, py] = pentagonPoint(i, maxR, cx, cy);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={px}
              y2={py}
              stroke="white"
              strokeOpacity={0.06}
              strokeWidth="0.5"
            />
          );
        })}

        {/* Filled stat polygon */}
        <polygon
          points={statPolygonPoints(s, maxR, cx, cy)}
          fill="rgba(255, 191, 0, 0.15)"
          stroke="#ffbf00"
          strokeWidth="1"
          strokeOpacity="0.7"
        />

        {/* Stat vertex dots */}
        {[s.craft, s.lore, s.signal, s.spirit, s.style].map((v, i) => {
          const [px, py] = pentagonPoint(i, maxR * Math.max(v, 0.05), cx, cy);
          return <circle key={i} cx={px} cy={py} r="1.5" fill="#ffbf00" fillOpacity="0.8" />;
        })}

        {/* Axis labels */}
        {AXES.map((label, i) => {
          const pos = labelPosition(i, maxR, cx, cy);
          return (
            <text
              key={label}
              x={pos.x}
              y={pos.y + 3}
              textAnchor={pos.anchor}
              className="font-pixel"
              fontSize="5"
              fill="white"
              fillOpacity="0.4"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Info lines */}
      <div className="px-1 space-y-0.5 mt-1">
        <div className="font-pixel text-[6px] text-green-400/50 tracking-wider">
          {zone ? zone.name : "ROAMING"}
        </div>
        <div className="font-pixel text-[6px] text-white/25 tracking-wider">
          PIECES: {piecesCollected}/6
        </div>
        <div className="font-pixel text-[6px] text-white/25 tracking-wider">
          VISITS: {visitCount}
        </div>
      </div>
    </div>
  );
}
