import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

const SESSION_COOKIE = "shelley_session";

interface GameEventBody {
  type: "completed" | "skipped" | "score_update" | "onboarding_complete";
  gameName?: string;
  score?: number;
  picks?: number;
  distance?: number;
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
  account_id: number | null;
}

// POST /api/game-event — Report a game event. Updates progress.
export async function POST(req: Request) {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const body: GameEventBody = await req.json();

  // Fetch current progress
  const current = await query<ProgressRow>(
    `SELECT games_played, games_completed, games_skipped,
            total_score, total_picks, po_relationship,
            onboarding_complete, fourth_wall_unlocked,
            game_records, account_id
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

  // Update based on event type
  switch (body.type) {
    case "completed": {
      const gameName = body.gameName ?? "unknown";
      const record = records[gameName] ?? {
        timesPlayed: 0, timesCompleted: 0, highScore: 0, lastScore: 0, bestDistance: 0,
      };
      record.timesPlayed += 1;
      record.timesCompleted += 1;
      record.lastScore = body.score ?? 0;
      record.highScore = Math.max(record.highScore, record.lastScore);
      record.bestDistance = Math.max(record.bestDistance, body.distance ?? 0);
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
        [
          sessionId,
          body.score ?? 0,
          body.picks ?? 0,
          newRelationship,
          fourthWall,
          JSON.stringify(records),
        ]
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
        [sessionId, body.score ?? 0, body.picks ?? 0]
      );
      break;
    }

    case "onboarding_complete": {
      const newRelationship = Math.min(100, row.po_relationship + 5);
      await query(
        `UPDATE game_progress SET
          onboarding_complete = TRUE,
          po_relationship = $2,
          updated_at = NOW()
        WHERE session_id = $1`,
        [sessionId, newRelationship]
      );
      break;
    }
  }

  // Fetch updated progress to return
  const updated = await query<ProgressRow>(
    `SELECT games_played, games_completed, games_skipped,
            total_score, total_picks, po_relationship,
            onboarding_complete, fourth_wall_unlocked, game_records
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
      gameRecords: u.game_records,
    },
  });
}
