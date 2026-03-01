import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

interface ZoneOGProps {
  zoneName: string;
  subtitle: string;
  tagline: string;
  accentColor: string;
}

export function createZoneOGImage({
  zoneName,
  subtitle,
  tagline,
  accentColor,
}: ZoneOGProps) {
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
            background: accentColor,
          }}
        />
        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: `${accentColor}99`,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
            }}
          >
            {subtitle}
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.08em",
            }}
          >
            {zoneName}
          </div>
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.35)",
              maxWidth: 500,
              textAlign: "center",
              lineHeight: 1.5,
              marginTop: 8,
            }}
          >
            {tagline}
          </div>
        </div>
        {/* Brand */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 32,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 14,
            letterSpacing: "0.15em",
          }}
        >
          <span style={{ color: "#ffffff" }}>SHELLEY</span>
          <span style={{ color: "#ffbf00" }}>GUITAR</span>
        </div>
        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: accentColor,
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
    { ...OG_SIZE }
  );
}
