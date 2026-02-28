// ─── Zone Configuration ─────────────────────────────────────────────────────
// Single source of truth for zone theming, ambient effects, and Po quotes.

export type ZoneId = "workshop" | "gallery" | "librarynth" | "contact";

export interface ZoneConfig {
  id: ZoneId;
  name: string;
  subtitle: string;
  tagline: string;
  accentColor: string;
  accentHex: string;
  glowClass: string;
  sectionHeaderColor: "amber" | "blue" | "purple" | "green";
  particleType: "sawdust" | "motes" | "sparkles" | "signals";
  borderColorClass: string;
  poQuotes: string[];
}

export const ZONES: Record<ZoneId, ZoneConfig> = {
  workshop: {
    id: "workshop",
    name: "THE FORGE",
    subtitle: "Workshop",
    tagline: "Where wood meets steel and passion becomes music.",
    accentColor: "text-shelley-amber",
    accentHex: "#ffbf00",
    glowClass: "crt-glow",
    sectionHeaderColor: "amber",
    particleType: "sawdust",
    borderColorClass: "border-shelley-amber/20",
    poQuotes: [
      "This is where Magus shapes sound itself. Every guitar starts as a plank and a dream.",
      "You can smell the cedar from here. ...I think. I don't have a nose.",
      "See those chisels? Each one sharper than my memory. Which isn't saying much.",
      "The go-bar deck is basically a medieval torture device. For wood.",
    ],
  },
  gallery: {
    id: "gallery",
    name: "THE SHOWCASE",
    subtitle: "Gallery",
    tagline: "Handcrafted instruments and the stories they carry.",
    accentColor: "text-shelley-djinn-purple",
    accentHex: "#8b5cf6",
    glowClass: "crt-glow-purple",
    sectionHeaderColor: "purple",
    particleType: "motes",
    borderColorClass: "border-shelley-djinn-purple/20",
    poQuotes: [
      "Welcome to the wall of legends. Each one has a story. And yeah, they all shred.",
      "That Djinn guitar hums when no one is playing it. I'm not making that up.",
      "I tried to play one once. Turns out ghost fingers go through the strings.",
      "Magus says a guitar's soul develops over time. I believe him. I've seen weirder.",
    ],
  },
  librarynth: {
    id: "librarynth",
    name: "THE CRYSTAL ARCHIVE",
    subtitle: "Library + Labyrinth",
    tagline: "Study space meets creative labyrinth. Everything Shelley, all in one place.",
    accentColor: "text-shelley-spirit-blue",
    accentHex: "#4a90d9",
    glowClass: "crt-glow-blue",
    sectionHeaderColor: "blue",
    particleType: "sparkles",
    borderColorClass: "border-shelley-spirit-blue/20",
    poQuotes: [
      "The Librarynth... part library, part labyrinth. I once got lost here for three weeks. Or three minutes. Hard to tell.",
      "Every book in here is a door to somewhere else. Literally. Don't open the red ones.",
      "Magus keeps his deepest ideas here. I keep my snacks here. Priorities.",
      "The crystals hum a different note depending on who walks past. Mine is apparently B-flat.",
    ],
  },
  contact: {
    id: "contact",
    name: "THE SIGNAL TOWER",
    subtitle: "Contact",
    tagline: "Drop a signal. We're always listening.",
    accentColor: "text-shelley-spirit-green",
    accentHex: "#5ae05a",
    glowClass: "crt-glow-green",
    sectionHeaderColor: "green",
    particleType: "signals",
    borderColorClass: "border-shelley-spirit-green/20",
    poQuotes: [
      "Drop a signal! Hpar's on the other end. He literally never misses.",
      "This tower reaches every corner of the Djinn World. And Instagram.",
      "Messages go faster when you write them in all caps. That's not true. But it feels true.",
      "Magus checks messages between builds. So basically... constantly.",
    ],
  },
};

export function getZoneForRoute(pathname: string): ZoneConfig | null {
  const slug = pathname.replace(/^\//, "") as ZoneId;
  return ZONES[slug] ?? null;
}
