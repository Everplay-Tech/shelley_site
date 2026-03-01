import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
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
          borderRadius: 64,
        }}
      >
        <div
          style={{
            fontSize: 288,
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
