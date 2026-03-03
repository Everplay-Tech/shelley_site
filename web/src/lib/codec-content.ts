// ─── Dynamic Codec Content System ──────────────────────────────────────────
// Returns contextual dialogue for the full-screen codec overlay.
// Priority: first visit > milestones > returning > time-based > generic fallback.

import type { ZoneId } from "./zone-config";
import { ZONES } from "./zone-config";

export interface CodecLine {
  speaker: string;
  text: string;
}

export interface CodecScript {
  lines: CodecLine[];
}

export interface CodecContext {
  zoneId: ZoneId | null;
  visitCount: number;
  piecesCollected: number;
  onboardingComplete: boolean;
}

// ─── Zone-specific first visit intros ──────────────────────────────────────

const ZONE_INTROS: Record<ZoneId, CodecLine[]> = {
  workshop: [
    { speaker: "PO", text: "Welcome to the Workshop." },
    { speaker: "PO", text: "This is where Magus turns raw wood into living instruments. Every guitar starts right here." },
    { speaker: "PO", text: "Smell that? Cedar and sawdust. ...I think. No nose, remember?" },
  ],
  gallery: [
    { speaker: "PO", text: "The Gallery. Where the finished ones live." },
    { speaker: "PO", text: "Each guitar on this wall has a story. Some of them hum when nobody's playing." },
    { speaker: "PO", text: "Don't tell Magus I said that. He'll start talking about resonance for three hours." },
  ],
  librarynth: [
    { speaker: "PO", text: "You found the Librarynth." },
    { speaker: "PO", text: "Part library, part labyrinth. Everything Shelley — the philosophy, the universe, the cast." },
    { speaker: "PO", text: "I got lost in here once for three weeks. Or three minutes. Time is weird in here." },
  ],
  contact: [
    { speaker: "PO", text: "The signal tower." },
    { speaker: "PO", text: "Drop a message from here and it reaches Magus directly. He checks between builds." },
    { speaker: "PO", text: "Which means... constantly." },
  ],
};

// ─── Return visit lines ────────────────────────────────────────────────────

const ZONE_RETURNS: Record<ZoneId, CodecLine[][]> = {
  workshop: [
    [
      { speaker: "PO", text: "Back in the Workshop? Good taste." },
      { speaker: "PO", text: "Magus has been busy. Check the current builds." },
    ],
    [
      { speaker: "PO", text: "You again! The sawdust missed you." },
      { speaker: "PO", text: "...Actually, sawdust doesn't have feelings. But I do. Allegedly." },
    ],
  ],
  gallery: [
    [
      { speaker: "PO", text: "Back to admire the wall? Same." },
      { speaker: "PO", text: "Every time I look at the Djinn guitar I hear something different." },
    ],
    [
      { speaker: "PO", text: "The Gallery is always changing." },
      { speaker: "PO", text: "New builds go up, old ones find homes. Circle of guitar life." },
    ],
  ],
  librarynth: [
    [
      { speaker: "PO", text: "Returning to the stacks. Brave." },
      { speaker: "PO", text: "The crystals are humming louder today. That's either good or... concerning." },
    ],
    [
      { speaker: "PO", text: "Welcome back to the maze." },
      { speaker: "PO", text: "I left some snacks in the philosophy section. Don't judge me." },
    ],
  ],
  contact: [
    [
      { speaker: "PO", text: "More signals to send?" },
      { speaker: "PO", text: "Hpar's always on the other end. Ronin dedication." },
    ],
    [
      { speaker: "PO", text: "The tower is active." },
      { speaker: "PO", text: "Messages have been flowing. Magus appreciates every one." },
    ],
  ],
};

// ─── Milestone lines ───────────────────────────────────────────────────────

const PIECE_MILESTONES: { minPieces: number; lines: CodecLine[] }[] = [
  {
    minPieces: 6,
    lines: [
      { speaker: "PO", text: "You did it. All six pieces of the Forbidden Six." },
      { speaker: "PO", text: "Magus always said someone would collect them all. I didn't believe him." },
      { speaker: "PO", text: "Check your rewards. You've earned something special." },
    ],
  },
  {
    minPieces: 3,
    lines: [
      { speaker: "PO", text: "Three pieces collected. You're halfway there." },
      { speaker: "PO", text: "The Forbidden Six are scattered across every zone. Keep exploring." },
    ],
  },
  {
    minPieces: 1,
    lines: [
      { speaker: "PO", text: "You found a piece! The Forbidden Six collection has begun." },
      { speaker: "PO", text: "There are six total, hidden in the games. Find them all for something special." },
    ],
  },
];

// ─── Post-onboarding lines ─────────────────────────────────────────────────

const POST_ONBOARDING: CodecLine[] = [
  { speaker: "PO", text: "You met Captain Magus at the end of the run." },
  { speaker: "PO", text: "Now you've seen the whole world. Workshop, Gallery, Librarynth, Contact." },
  { speaker: "PO", text: "This is Shelley Guitar. Stick around." },
];

// ─── Generic fallback (no zone) ────────────────────────────────────────────

const GENERIC_LINES: CodecLine[][] = [
  [
    { speaker: "PO", text: "Don't mind me. Just haunting." },
    { speaker: "PO", text: "Magus says I need to focus. Focus on what?" },
  ],
  [
    { speaker: "PO", text: "I had something important to say..." },
    { speaker: "PO", text: "...never mind. It'll come back to me. Probably." },
  ],
  [
    { speaker: "PO", text: "Ghost problems: walking through doors is too easy." },
    { speaker: "PO", text: "Where's the challenge? Where's the drama?" },
  ],
];

// ─── Time-based greetings ──────────────────────────────────────────────────

function getTimeGreeting(): CodecLine | null {
  const hour = new Date().getHours();
  if (hour < 6) return { speaker: "PO", text: "It's the middle of the night. Respect." };
  if (hour < 12) return { speaker: "PO", text: "Morning session. The best ideas happen before noon." };
  if (hour >= 22) return { speaker: "PO", text: "Late night exploring? My kind of person." };
  return null;
}

// ─── Main selection function ───────────────────────────────────────────────

export function getCodecScript(context: CodecContext): CodecScript {
  const { zoneId, visitCount, piecesCollected, onboardingComplete } = context;

  // 1. Piece milestones (highest priority — rare, meaningful)
  for (const milestone of PIECE_MILESTONES) {
    if (piecesCollected >= milestone.minPieces) {
      return { lines: milestone.lines };
    }
  }

  // 2. Post-onboarding (only once, when it's fresh)
  if (onboardingComplete && visitCount <= 2) {
    return { lines: POST_ONBOARDING };
  }

  // 3. Zone-specific first visit
  if (zoneId && visitCount <= 1) {
    const intro = ZONE_INTROS[zoneId];
    if (intro) {
      const timeGreeting = getTimeGreeting();
      const lines = timeGreeting ? [timeGreeting, ...intro] : intro;
      return { lines };
    }
  }

  // 4. Zone-specific return visit
  if (zoneId && visitCount > 1) {
    const returns = ZONE_RETURNS[zoneId];
    if (returns) {
      const idx = Math.floor(Math.random() * returns.length);
      return { lines: returns[idx] };
    }
  }

  // 5. Zone poQuotes as single-line fallback
  if (zoneId) {
    const zone = ZONES[zoneId];
    const idx = Math.floor(Math.random() * zone.poQuotes.length);
    return { lines: [{ speaker: "PO", text: zone.poQuotes[idx] }] };
  }

  // 6. Generic fallback (no zone context)
  const idx = Math.floor(Math.random() * GENERIC_LINES.length);
  return { lines: GENERIC_LINES[idx] };
}
