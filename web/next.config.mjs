/** @type {import('next').NextConfig} */
const nextConfig = {
  // Godot HTML5 exports are served from public/games/ as static assets.
  // Games export single-threaded (no SharedArrayBuffer needed).

  // Remove X-Powered-By header
  poweredByHeader: false,

  // Explicit gzip/brotli compression
  compress: true,

  // ── Config-driven caching headers ──
  // Glob patterns auto-cover all current and future assets.
  async headers() {
    return [
      // WASM files: 36MB+ each, same filename on re-export.
      // 7 days cached, background revalidation for 1 day after expiry.
      {
        source: "/games/:path*/index.wasm",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
          {
            key: "Content-Type",
            value: "application/wasm",
          },
        ],
      },
      // PCK files (game data): same strategy as WASM
      {
        source: "/games/:path*/index.pck",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      // Godot JS runtime + worklet files: shorter cache, they're small
      {
        source: "/games/:path*/:file*.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600",
          },
        ],
      },
      // Game HTML entry points: no cache (must be fresh to catch COOP/COEP fixes)
      {
        source: "/games/:path*/index.html",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate",
          },
        ],
      },
      // Fonts: immutable, 1 year (filenames never change)
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Sprites: 30 days with background revalidation
      {
        source: "/sprites/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
