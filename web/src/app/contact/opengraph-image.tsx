import { createZoneOGImage, OG_SIZE } from "@/lib/og-helpers";

export const runtime = "edge";
export const alt = "Get In Touch — Shelley Guitar";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createZoneOGImage({
    zoneName: "GET IN TOUCH",
    subtitle: "Contact",
    tagline: "Drop a signal. We're always listening.",
    accentColor: "#5ae05a",
  });
}
