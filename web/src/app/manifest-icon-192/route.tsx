import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          borderRadius: 24,
        }}
      >
        <div
          style={{
            fontSize: 108,
            fontWeight: 700,
            color: "#ffbf00",
          }}
        >
          S
        </div>
      </div>
    ),
    {
      width: 192,
      height: 192,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
