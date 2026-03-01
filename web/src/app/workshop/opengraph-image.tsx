import { createZoneOGImage, OG_SIZE } from "@/lib/og-helpers";

export const runtime = "edge";
export const alt = "The Workshop — Shelley Guitar";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createZoneOGImage({
    zoneName: "THE WORKSHOP",
    subtitle: "Workshop",
    tagline: "Where wood meets steel and passion becomes music.",
    accentColor: "#ffbf00",
  });
}
