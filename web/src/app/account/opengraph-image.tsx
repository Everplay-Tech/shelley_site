import { createZoneOGImage, OG_SIZE } from "@/lib/og-helpers";

export const runtime = "edge";
export const alt = "Account — Shelley Guitar";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createZoneOGImage({
    zoneName: "ACCOUNT",
    subtitle: "Your Space",
    tagline: "Saves, orders, rewards, and everything that's yours.",
    accentColor: "#4a90d9",
  });
}
