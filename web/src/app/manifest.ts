import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shelley Guitar | Handcrafted Instruments & Creative Universe",
    short_name: "Shelley Guitar",
    description:
      "Boutique handcrafted guitars built with intention. Luthier craft meets pixel-art adventure.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1a1a",
    theme_color: "#1a1a1a",
    orientation: "any",
    categories: ["music", "shopping", "entertainment"],
    icons: [
      {
        src: "/manifest-icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/manifest-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/manifest-icon-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
