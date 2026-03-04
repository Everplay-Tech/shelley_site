// ─── Zone Configuration ─────────────────────────────────────────────────────
// Single source of truth for zone theming, ambient effects, Po quotes, and costumes.

export type ZoneId = "workshop" | "gallery" | "librarynth" | "contact";

// ─── Po Costume System ──────────────────────────────────────────────────────

export type PoCostumeId =
  | "default"
  | "craftsman"
  | "artist"
  | "scholar"
  | "messenger"
  | "sleepy"
  | "glitch"
  | "moped";

export interface PoAnimationSheet {
  id: string;
  sheetPath: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  fps?: number; // Target playback fps (default: 2.5 for legacy 4-frame sheets, 24 for interpolated)
}

export interface PoCostumeConfig {
  sheetPath: string;                // primary sheet (backward compat for PoStatus/PoAside)
  label: string;
  sheets?: PoAnimationSheet[];      // multi-animation variants (PoCodec picks randomly)
  portrait?: string;                // static portrait for codec dialogue
}

export const PO_COSTUMES: Record<PoCostumeId, PoCostumeConfig> = {
  default: {
    sheetPath: "/sprites/po/idle_24f_sheet.png",
    label: "Po",
    sheets: [
      { id: "idle-24", sheetPath: "/sprites/po/idle_24f_sheet.png", frames: 24, frameWidth: 256, frameHeight: 256, fps: 8 },
    ],
    portrait: "/sprites/po/idle_00.png",
  },
  craftsman: { sheetPath: "/sprites/po/costumes/craftsman_idle_sheet.png", label: "Craftsman Po" },
  artist:    { sheetPath: "/sprites/po/costumes/artist_idle_sheet.png",    label: "Artist Po" },
  scholar:   { sheetPath: "/sprites/po/costumes/scholar_idle_sheet.png",   label: "Scholar Po" },
  messenger: { sheetPath: "/sprites/po/costumes/messenger_idle_sheet.png", label: "Messenger Po" },
  sleepy:    { sheetPath: "/sprites/po/costumes/sleepy_idle_sheet.png",    label: "Sleepy Po" },
  glitch:    { sheetPath: "/sprites/po/costumes/glitch_idle_sheet.png",    label: "Glitch Po" },
  moped: {
    sheetPath: "/sprites/po/moped_ride_8f_sheet.png",
    label: "Moped Po",
    sheets: [
      { id: "ride", sheetPath: "/sprites/po/moped_ride_8f_sheet.png", frames: 8, frameWidth: 256, frameHeight: 256, fps: 8 },
    ],
  },
};

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
  poCostume: PoCostumeId;
  cartridgeImage: string;
}

export const ZONES: Record<ZoneId, ZoneConfig> = {
  workshop: {
    id: "workshop",
    name: "THE WORKSHOP",
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
    poCostume: "craftsman",
    cartridgeImage: "/images/cartridges/workshop.png",
  },
  gallery: {
    id: "gallery",
    name: "THE GALLERY",
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
    poCostume: "artist",
    cartridgeImage: "/images/cartridges/gallery.png",
  },
  librarynth: {
    id: "librarynth",
    name: "THE LIBRARYNTH",
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
    poCostume: "scholar",
    cartridgeImage: "/images/cartridges/librarynth.png",
  },
  contact: {
    id: "contact",
    name: "GET IN TOUCH",
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
    poCostume: "messenger",
    cartridgeImage: "/images/cartridges/contact.png",
  },
};

export function getZoneForRoute(pathname: string): ZoneConfig | null {
  const slug = pathname.replace(/^\//, "") as ZoneId;
  return ZONES[slug] ?? null;
}
