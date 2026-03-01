import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  // Maskable icons: important content must be within center 80% safe zone.
  // No border-radius — Android adaptive icon system handles masking.
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
        }}
      >
        <div
          style={{
            fontSize: 240,
            fontWeight: 700,
            color: "#ffbf00",
          }}
        >
          S
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
