// ─── Mural System Configuration ─────────────────────────────────────────────
// Data-driven mural definitions. Add a mural = add entry here + drop image file.
// Murals are shuffled randomly on each page mount.

export type MuralVariant = "cave" | "ceiling" | "scroll";

export interface MuralDef {
  id: string;
  image: string;
  alt: string;
  variant: MuralVariant;
  hebrewNumeral: string;
}

// Hebrew numerals (aleph → tav, then composite)
const HEBREW_NUMERALS = [
  "א","ב","ג","ד","ה","ו","ז","ח","ט","י",
  "יא","יב","יג","יד","טו","טז","יז","יח","יט","כ","כא","כב",
];

const MURALS_BASE: Omit<MuralDef, "hebrewNumeral">[] = [
  {
    id: "lascaux",
    image: "/images/mural/lascaux/panoramic.jpg",
    alt: "Prehistoric cave painting depicting Arlak and Leon amid ancient symbols",
    variant: "cave",
  },
  {
    id: "sistine",
    image: "/images/mural/sistine/panoramic.jpg",
    alt: "Renaissance ceiling fresco of the Kronosomicon deities and cosmic creation",
    variant: "ceiling",
  },
  {
    id: "scroll",
    image: "/images/mural/scroll/panoramic.jpg",
    alt: "Chinese ink wash scroll of the Tree of Giving and Radio Kingdom monk",
    variant: "scroll",
  },
];

export function getShuffledMurals(): MuralDef[] {
  const shuffled = [...MURALS_BASE];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((m, i) => ({
    ...m,
    hebrewNumeral: HEBREW_NUMERALS[i] || `${i + 1}`,
  }));
}
