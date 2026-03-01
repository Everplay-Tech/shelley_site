import { createZoneOGImage, OG_SIZE } from "@/lib/og-helpers";

export const runtime = "edge";
export const alt = "The Librarynth — Shelley Guitar";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createZoneOGImage({
    zoneName: "THE LIBRARYNTH",
    subtitle: "Library + Labyrinth",
    tagline: "Study space meets creative labyrinth. Everything Shelley, all in one place.",
    accentColor: "#4a90d9",
  });
}
