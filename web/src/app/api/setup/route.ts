import { NextResponse } from "next/server";
import { initSchema } from "@/lib/db";

// POST /api/setup — Run once to create database tables.
// Protected by a secret to prevent random callers.
export async function POST(req: Request) {
  const { secret } = await req.json().catch(() => ({ secret: "" }));

  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await initSchema();
    return NextResponse.json({ ok: true, message: "Schema created" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
