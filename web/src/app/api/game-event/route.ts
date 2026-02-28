import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

const SESSION_COOKIE = "shelley_session";

// The Forbidden Six — discount code for collecting all 6 artifact pieces
const FORBIDDEN_SIX_CODE = "SIX25";
const FORBIDDEN_SIX_TOTAL = 6;

// Sane limits for numeric inputs
const MAX_SCORE = 999_999;
const MAX_PICKS = 99_999;
const MAX_DISTANCE = 99_999;

function clampInt(val: unknown, min: number, max: number): number {
  const n = typeof val === "number" ? Math.floor(val) : 0;
  return Math.max(min, Math.min(max, n));
}

interface GameEventBody {
  type: "completed" | "skipped" | "score_update" | "onboarding_complete" | "piece_collected";
  gameName?: string;
  score?: number;
  picks?: number;
  distance?: number;
  pieceIndex?: number;
  pieceTotal?: number;
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
  pieces_collected: number;
  reward_code: string | null;
  game_records: Record<string, unknown>;
}

// POST /api/game-event — Report a game event. Updates progress.
export async function POST(req: Request) {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  let body: GameEventBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validTypes = ["completed", "skipped", "score_update", "onboarding_complete", "piece_collected"];
  if (!body.type || !validTypes.includes(body.type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  try {
    // Fetch current progress
    const current = await query<ProgressRow>(
      `SELECT games_played, games_completed, games_skipped,
              total_score, total_picks, po_relationship,
              onboarding_complete, fourth_wall_unlocked,
              pieces_collected, reward_code, game_records
       FROM game_progress WHERE session_id = $1`,
      [sessionId]
    );

    if (current.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const row = current.rows[0];
    const records = (row.game_records ?? {}) as Record<string, {
      timesPlayed: number;
      timesCompleted: number;
      highScore: number;
      lastScore: number;
      bestDistance: number;
    }>;

    // Sanitize numeric inputs
    const score = clampInt(body.score, 0, MAX_SCORE);
    const picks = clampInt(body.picks, 0, MAX_PICKS);
    const distance = clampInt(body.distance, 0, MAX_DISTANCE);

    // Update based on event type
    switch (body.type) {
      case "completed": {
        const gameName = body.gameName ?? "unknown";
        const record = records[gameName] ?? {
          timesPlayed: 0, timesCompleted: 0, highScore: 0, lastScore: 0, bestDistance: 0,
        };
        record.timesPlayed += 1;
        record.timesCompleted += 1;
        record.lastScore = score;
        record.highScore = Math.max(record.highScore, record.lastScore);
        record.bestDistance = Math.max(record.bestDistance, distance);
        records[gameName] = record;

        const newRelationship = Math.min(100, row.po_relationship + 3);
        const fourthWall = (row.games_completed + 1) >= 2 && newRelationship >= 30;

        await query(
          `UPDATE game_progress SET
            games_played = games_played + 1,
            games_completed = games_completed + 1,
            total_score = total_score + $2,
            total_picks = total_picks + $3,
            po_relationship = $4,
            fourth_wall_unlocked = $5,
            game_records = $6,
            updated_at = NOW()
          WHERE session_id = $1`,
          [sessionId, score, picks, newRelationship, fourthWall, JSON.stringify(records)]
        );
        break;
      }

      case "skipped": {
        const gameName = body.gameName ?? "unknown";
        const record = records[gameName] ?? {
          timesPlayed: 0, timesCompleted: 0, highScore: 0, lastScore: 0, bestDistance: 0,
        };
        record.timesPlayed += 1;
        records[gameName] = record;

        const newRelationship = Math.max(0, row.po_relationship - 1);

        await query(
          `UPDATE game_progress SET
            games_played = games_played + 1,
            games_skipped = games_skipped + 1,
            po_relationship = $2,
            game_records = $3,
            updated_at = NOW()
          WHERE session_id = $1`,
          [sessionId, newRelationship, JSON.stringify(records)]
        );
        break;
      }

      case "score_update": {
        await query(
          `UPDATE game_progress SET
            total_score = total_score + $2,
            total_picks = total_picks + $3,
            updated_at = NOW()
          WHERE session_id = $1`,
          [sessionId, score, picks]
        );
        break;
      }

      case "piece_collected": {
        // Track artifact pieces — simple increment capped at FORBIDDEN_SIX_TOTAL
        const newCount = Math.min(FORBIDDEN_SIX_TOTAL, (row.pieces_collected ?? 0) + 1);
        // Generate reward code when all pieces collected (idempotent)
        const rewardCode = newCount >= FORBIDDEN_SIX_TOTAL
          ? (row.reward_code ?? FORBIDDEN_SIX_CODE)
          : row.reward_code;

        await query(
          `UPDATE game_progress SET
            pieces_collected = $2,
            reward_code = $3,
            updated_at = NOW()
          WHERE session_id = $1`,
          [sessionId, newCount, rewardCode]
        );
        break;
      }

      case "onboarding_complete": {
        const newRelationship = Math.min(100, row.po_relationship + 5);
        // If player collected all 6 pieces, ensure reward code is set
        const rewardCode = (row.pieces_collected ?? 0) >= FORBIDDEN_SIX_TOTAL
          ? (row.reward_code ?? FORBIDDEN_SIX_CODE)
          : row.reward_code;

        await query(
          `UPDATE game_progress SET
            onboarding_complete = TRUE,
            po_relationship = $2,
            reward_code = $3,
            updated_at = NOW()
          WHERE session_id = $1`,
          [sessionId, newRelationship, rewardCode]
        );
        break;
      }
    }

    // Fetch updated progress to return
    const updated = await query<ProgressRow>(
      `SELECT games_played, games_completed, games_skipped,
              total_score, total_picks, po_relationship,
              onboarding_complete, fourth_wall_unlocked,
              pieces_collected, reward_code, game_records
       FROM game_progress WHERE session_id = $1`,
      [sessionId]
    );

    const u = updated.rows[0];
    return NextResponse.json({
      progress: {
        gamesPlayed: u.games_played,
        gamesCompleted: u.games_completed,
        gamesSkipped: u.games_skipped,
        totalScore: u.total_score,
        totalPicks: u.total_picks,
        poRelationship: u.po_relationship,
        onboardingComplete: u.onboarding_complete,
        fourthWallUnlocked: u.fourth_wall_unlocked,
        piecesCollected: u.pieces_collected ?? 0,
        rewardCode: u.reward_code,
        gameRecords: u.game_records,
      },
    });
  } catch (err) {
    console.error("[game-event] Database error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
