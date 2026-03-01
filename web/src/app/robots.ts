import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/testing", "/testinggame01"],
    },
    sitemap: "https://www.shelleyguitar.com/sitemap.xml",
  };
}
