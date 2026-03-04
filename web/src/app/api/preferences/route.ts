import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { DEFAULT_PREFERENCES, PREFS_COOKIE } from "@/lib/preferences";
import type { UserPreferences } from "@/lib/preferences";

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get("shelley_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
  }

  try {
    const result = await query<{ preferences: Record<string, unknown> }>(
      "SELECT preferences FROM game_progress WHERE session_id = $1",
      [sessionId]
    );
    const prefs = result.rows[0]?.preferences ?? {};
    return NextResponse.json({
      preferences: { ...DEFAULT_PREFERENCES, ...prefs },
    });
  } catch {
    return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
  }
}

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get("shelley_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const prefs: Partial<UserPreferences> = {};

    if (typeof body.gamesEnabled === "boolean") {
      prefs.gamesEnabled = body.gamesEnabled;
    }

    await query(
      `UPDATE game_progress
       SET preferences = preferences || $1::jsonb
       WHERE session_id = $2`,
      [JSON.stringify(prefs), sessionId]
    );

    const merged = { ...DEFAULT_PREFERENCES, ...prefs };

    const response = NextResponse.json({ preferences: merged });
    response.cookies.set(PREFS_COOKIE, JSON.stringify(merged), {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
