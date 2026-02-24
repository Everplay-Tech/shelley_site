import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { query } from "@/lib/db";

const SESSION_COOKIE = "shelley_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

interface SessionRow {
  id: string;
}

interface ProgressRow {
  games_played: number;
  games_completed: number;
  games_skipped: number;
  total_score: number;
  total_picks: number;
  po_relationship: number;
  onboarding_complete: boolean;
  fourth_wall_unlocked: boolean;
  game_records: Record<string, unknown>;
}

// POST /api/session — Create or resume a session.
// Returns current game progress + session ID.
export async function POST() {
  const cookieStore = cookies();
  const headerStore = headers();
  const existingSession = cookieStore.get(SESSION_COOKIE)?.value;
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = headerStore.get("user-agent") ?? "unknown";

  let sessionId: string | undefined = existingSession;

  // Try to resume existing session
  if (sessionId) {
    const check = await query<SessionRow>(
      "SELECT id FROM sessions WHERE id = $1",
      [sessionId]
    );
    if (check.rows.length === 0) {
      sessionId = undefined; // Cookie exists but session gone, create new
    } else {
      // Touch last_seen
      await query("UPDATE sessions SET last_seen_at = NOW() WHERE id = $1", [sessionId]);
    }
  }

  // Create new session if needed
  if (!sessionId) {
    const result = await query<SessionRow>(
      "INSERT INTO sessions (ip_address, user_agent) VALUES ($1, $2) RETURNING id",
      [ip, ua]
    );
    sessionId = result.rows[0].id;

    // Create empty progress row
    await query(
      "INSERT INTO game_progress (session_id) VALUES ($1)",
      [sessionId]
    );
  }

  // Fetch progress
  const progress = await query<ProgressRow>(
    `SELECT games_played, games_completed, games_skipped,
            total_score, total_picks, po_relationship,
            onboarding_complete, fourth_wall_unlocked, game_records
     FROM game_progress WHERE session_id = $1`,
    [sessionId]
  );

  const row = progress.rows[0] ?? {
    games_played: 0,
    games_completed: 0,
    games_skipped: 0,
    total_score: 0,
    total_picks: 0,
    po_relationship: 0,
    onboarding_complete: false,
    fourth_wall_unlocked: false,
    game_records: {},
  };

  // Set session cookie
  const response = NextResponse.json({
    sessionId,
    progress: {
      gamesPlayed: row.games_played,
      gamesCompleted: row.games_completed,
      gamesSkipped: row.games_skipped,
      totalScore: row.total_score,
      totalPicks: row.total_picks,
      poRelationship: row.po_relationship,
      onboardingComplete: row.onboarding_complete,
      fourthWallUnlocked: row.fourth_wall_unlocked,
      gameRecords: row.game_records,
    },
  });

  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
