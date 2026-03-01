import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Shelley Guitar — Handcrafted Instruments & Creative Universe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "#ffbf00",
          }}
        />
        {/* Brand */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,191,0,0.4)",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
            }}
          >
            Handcrafted Instruments
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.1em",
            }}
          >
            SHELLEY
            <span style={{ color: "#ffbf00" }}>GUITAR</span>
          </div>
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.4)",
              maxWidth: 500,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Boutique handcrafted guitars built with intention.
            Luthier craft meets pixel-art adventure.
          </div>
        </div>
        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "#ffbf00",
          }}
        />
        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            fontSize: 12,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: "0.2em",
          }}
        >
          shelleyguitar.com
        </div>
      </div>
    ),
    { ...size }
  );
}
