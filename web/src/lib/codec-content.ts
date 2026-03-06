// ─── Dynamic Codec Content System ──────────────────────────────────────────
// Returns contextual dialogue for the full-screen codec overlay.
// Priority: milestones > post-onboarding > zone first > zone return >
//           zone quotes > navigation/product suggestions > generic fallback.

import type { ZoneId } from "./zone-config";
import { ZONES } from "./zone-config";

// ─── Types ────────────────────────────────────────────────────────────────

export interface CodecAction {
  type: "navigate" | "product";
  url: string;
  label: string;
}

export interface CodecLine {
  speaker: string;
  text: string;
  action?: CodecAction;
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
  account: [
    { speaker: "PO", text: "Welcome to your Account." },
    { speaker: "PO", text: "Saves, orders, rewards — everything that's yours lives here." },
    { speaker: "PO", text: "I'd give you a tour but I forgot where everything is. Ghost brain." },
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
    [
      { speaker: "PO", text: "The smell of fresh lacquer. That means something just got finished." },
      { speaker: "PO", text: "Or Magus spilled again. Fifty-fifty." },
    ],
    [
      { speaker: "PO", text: "Workshop's humming today." },
      { speaker: "PO", text: "When the tools are going, I stand in the corner and pretend I'm helping." },
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
    [
      { speaker: "PO", text: "I swear that one moved when I walked past." },
      { speaker: "PO", text: "The purple one. Third from the left. It KNOWS things." },
    ],
    [
      { speaker: "PO", text: "Magus put a new one up this week." },
      { speaker: "PO", text: "He stands here staring at it like a proud parent. It's kind of sweet." },
    ],
  ],
  account: [
    [
      { speaker: "PO", text: "Checking in on your stuff? Smart." },
      { speaker: "PO", text: "Everything's where you left it. I didn't touch anything. Promise." },
    ],
    [
      { speaker: "PO", text: "Welcome back to your space." },
      { speaker: "PO", text: "Saves, rewards, orders — all accounted for. Pun intended." },
    ],
    [
      { speaker: "PO", text: "Your account is looking healthy." },
      { speaker: "PO", text: "I'd say 'organized' but I don't actually know what that means." },
    ],
    [
      { speaker: "PO", text: "Oh good, you're here." },
      { speaker: "PO", text: "I was watching your stuff. Guarding it. Definitely not sleeping." },
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
    [
      { speaker: "PO", text: "Got something to say? Say it." },
      { speaker: "PO", text: "Magus is better at replying than I am at remembering." },
    ],
    [
      { speaker: "PO", text: "The pigeons are ready." },
      { speaker: "PO", text: "...We don't actually use pigeons. But the metaphor stands." },
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
  { speaker: "PO", text: "Now you've seen the whole world. Workshop, Gallery, Account, Contact." },
  { speaker: "PO", text: "This is Shelley Guitar. Stick around." },
];

// ─── Navigation suggestions ───────────────────────────────────────────────

const NAVIGATION_LINES: CodecLine[][] = [
  [
    { speaker: "PO", text: "Have you seen the Workshop? Magus is always building something wild in there." },
    { speaker: "PO", text: "Go take a look.", action: { type: "navigate", url: "/workshop", label: "VISIT WORKSHOP" } },
  ],
  [
    { speaker: "PO", text: "The Gallery has some new pieces up. Real beauties." },
    { speaker: "PO", text: "Worth a look.", action: { type: "navigate", url: "/gallery", label: "VISIT GALLERY" } },
  ],
  [
    { speaker: "PO", text: "You know you can drop Magus a message directly, right?" },
    { speaker: "PO", text: "He actually reads them. Between builds.", action: { type: "navigate", url: "/contact", label: "SEND MESSAGE" } },
  ],
  [
    { speaker: "PO", text: "Your account page has your saves, rewards, the whole deal." },
    { speaker: "PO", text: "Might be worth checking in.", action: { type: "navigate", url: "/account", label: "VIEW ACCOUNT" } },
  ],
  [
    { speaker: "PO", text: "I keep forgetting to tell people about the Workshop." },
    { speaker: "PO", text: "That's where all the magic happens. Real talk.", action: { type: "navigate", url: "/workshop", label: "SEE THE WORKSHOP" } },
  ],
  [
    { speaker: "PO", text: "The Gallery wall changes every time Magus finishes a build." },
    { speaker: "PO", text: "I think he rearranges them at night. Perfectionist.", action: { type: "navigate", url: "/gallery", label: "BROWSE GALLERY" } },
  ],
  [
    { speaker: "PO", text: "Something on your mind? The contact tower is always listening." },
    { speaker: "PO", text: "Magus gets the signal instantly. No delay.", action: { type: "navigate", url: "/contact", label: "REACH OUT" } },
  ],
  [
    { speaker: "PO", text: "Between you and me, the Workshop smells incredible right now." },
    { speaker: "PO", text: "Fresh rosewood. Or maybe it's mahogany. Ghost nose, can't tell.", action: { type: "navigate", url: "/workshop", label: "VISIT WORKSHOP" } },
  ],
];

// ─── Product / shop suggestions ────────────────────────────────────────────

const PRODUCT_LINES: CodecLine[][] = [
  [
    { speaker: "PO", text: "The Shop has some limited stuff right now." },
    { speaker: "PO", text: "Pick it up before it's gone. Just saying.", action: { type: "navigate", url: "/shop", label: "VISIT SHOP" } },
  ],
  [
    { speaker: "PO", text: "Magus put something new in the Shop." },
    { speaker: "PO", text: "I'm not supposed to play favorites but... it's good.", action: { type: "navigate", url: "/shop", label: "CHECK IT OUT" } },
  ],
  [
    { speaker: "PO", text: "You ever thought about commissioning a custom build?" },
    { speaker: "PO", text: "Magus lives for that stuff. Hit the contact page.", action: { type: "navigate", url: "/contact", label: "TALK TO MAGUS" } },
  ],
  [
    { speaker: "PO", text: "Fun fact: every guitar in the Shop was a prototype first." },
    { speaker: "PO", text: "The ones that made the cut are in there.", action: { type: "navigate", url: "/shop", label: "BROWSE SHOP" } },
  ],
  [
    { speaker: "PO", text: "The Forbidden Six discount? That's the real deal." },
    { speaker: "PO", text: "Collect all six pieces from the games. 25% off a custom build.", action: { type: "navigate", url: "/shop", label: "VISIT SHOP" } },
  ],
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
  [
    { speaker: "PO", text: "You ever stare at a wall for so long it starts staring back?" },
    { speaker: "PO", text: "No? Just me? Cool." },
  ],
  [
    { speaker: "PO", text: "Magus once told me every guitar has a soul." },
    { speaker: "PO", text: "I asked where mine was. He pointed at the snack drawer." },
  ],
  [
    { speaker: "PO", text: "I tried to pick up a guitar once." },
    { speaker: "PO", text: "Phased right through it. Ghost hands. Very embarrassing." },
  ],
  [
    { speaker: "PO", text: "People ask me what it's like being a ghost." },
    { speaker: "PO", text: "Imagine having no body but still feeling hungry. That's the whole thing." },
  ],
  [
    { speaker: "PO", text: "The mural on the homepage? That was Magus's idea." },
    { speaker: "PO", text: "He said the walls should tell stories. I said the walls should have snacks." },
  ],
  [
    { speaker: "PO", text: "Sometimes I forget what I was doing mid-sentence." },
    { speaker: "PO", text: "But that's fine because—" },
    { speaker: "PO", text: "Wait, what were we talking about?" },
  ],
  [
    { speaker: "PO", text: "I've been thinking about time a lot lately." },
    { speaker: "PO", text: "Specifically, how it doesn't apply to me. Perks of the ghost life." },
  ],
  [
    { speaker: "PO", text: "You know what's weird about being a skeleton ghost?" },
    { speaker: "PO", text: "Everything. The answer is everything." },
  ],
  [
    { speaker: "PO", text: "Magus builds. I observe. It's a good system." },
    { speaker: "PO", text: "He gets the credit. I get the vibes." },
  ],
  [
    { speaker: "PO", text: "This site is basically a video game, in case you haven't noticed." },
    { speaker: "PO", text: "I'm the NPC with the best dialogue. Don't @ me." },
  ],
  [
    { speaker: "PO", text: "If I had a coin for every time someone skipped my dialogue..." },
    { speaker: "PO", text: "I'd have a lot of coins. And no pockets to put them in." },
  ],
  [
    { speaker: "PO", text: "Fun fact: I can phase through any wall except the fourth one." },
    { speaker: "PO", text: "Yeah. I see you there." },
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

  // 6. Navigation suggestion (20% chance)
  if (Math.random() < 0.2) {
    const idx = Math.floor(Math.random() * NAVIGATION_LINES.length);
    return { lines: NAVIGATION_LINES[idx] };
  }

  // 7. Product suggestion (10% chance)
  if (Math.random() < 0.125) {
    const idx = Math.floor(Math.random() * PRODUCT_LINES.length);
    return { lines: PRODUCT_LINES[idx] };
  }

  // 8. Generic fallback
  const idx = Math.floor(Math.random() * GENERIC_LINES.length);
  return { lines: GENERIC_LINES[idx] };
}
