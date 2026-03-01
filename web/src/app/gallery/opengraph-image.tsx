import { createZoneOGImage, OG_SIZE } from "@/lib/og-helpers";

export const runtime = "edge";
export const alt = "The Gallery — Shelley Guitar";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createZoneOGImage({
    zoneName: "THE GALLERY",
    subtitle: "Gallery",
    tagline: "Handcrafted instruments and the stories they carry.",
    accentColor: "#8b5cf6",
  });
}
