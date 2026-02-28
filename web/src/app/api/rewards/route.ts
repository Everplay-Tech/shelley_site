import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

const AUTH_COOKIE = "shelley_auth";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("[rewards] CRITICAL: JWT_SECRET is not set in production!");
}
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "shelley-dev-secret-change-in-prod"
);

interface AccountRow {
  rewards_earned: string[];
}

interface ProgressRow {
  games_completed: number;
  total_picks: number;
  po_relationship: number;
  pieces_collected: number;
}

// Reward definitions — will move to config/rewards.json in Phase 2
const REWARD_TIERS = [
  {
    id: "explorer",
    name: "Explorer",
    description: "Played your first game",
    condition: (p: ProgressRow) => p.games_completed >= 1,
    reward: { type: "badge" as const, value: "explorer" },
  },
  {
    id: "dedicated",
    name: "Dedicated Player",
    description: "Completed 3 games without skipping",
    condition: (p: ProgressRow) => p.games_completed >= 3,
    reward: { type: "discount" as const, code: "PO10", percent: 10 },
  },
  {
    id: "forbidden_six",
    name: "The Forbidden Six",
    description: "Collected all 6 artifact pieces",
    condition: (p: ProgressRow) => (p.pieces_collected ?? 0) >= 6,
    reward: { type: "discount" as const, code: "SIX25", percent: 25 },
  },
  {
    id: "bonded",
    name: "Po's Friend",
    description: "Built a bond with Po",
    condition: (p: ProgressRow) => p.po_relationship >= 50,
    reward: { type: "discount" as const, code: "BONDED15", percent: 15 },
  },
  {
    id: "collector",
    name: "Pick Collector",
    description: "Collected 500 picks total",
    condition: (p: ProgressRow) => p.total_picks >= 500,
    reward: { type: "discount" as const, code: "PICKS20", percent: 20 },
  },
];

// GET /api/rewards — Get rewards for authenticated user
export async function GET() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Account required for rewards" }, { status: 401 });
  }

  let accountId: number;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    accountId = payload.accountId as number;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    // Get account's earned rewards
    const account = await query<AccountRow>(
      "SELECT rewards_earned FROM accounts WHERE id = $1",
      [accountId]
    );
    if (account.rows.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get progress (may span multiple sessions linked to this account)
    const progress = await query<ProgressRow>(
      `SELECT
        COALESCE(SUM(games_completed), 0) as games_completed,
        COALESCE(SUM(total_picks), 0) as total_picks,
        COALESCE(MAX(po_relationship), 0) as po_relationship,
        COALESCE(MAX(pieces_collected), 0) as pieces_collected
      FROM game_progress WHERE account_id = $1`,
      [accountId]
    );

    const p = progress.rows[0];
    const earned = account.rows[0].rewards_earned ?? [];

    // Check for newly earned rewards
    const newlyEarned: string[] = [];
    for (const tier of REWARD_TIERS) {
      if (!earned.includes(tier.id) && tier.condition(p)) {
        newlyEarned.push(tier.id);
      }
    }

    // Persist newly earned rewards
    if (newlyEarned.length > 0) {
      const allEarned = [...earned, ...newlyEarned];
      await query(
        "UPDATE accounts SET rewards_earned = $1 WHERE id = $2",
        [allEarned, accountId]
      );
    }

    return NextResponse.json({
      rewards: REWARD_TIERS.map((tier) => ({
        ...tier,
        condition: undefined, // Don't expose condition functions
        earned: earned.includes(tier.id) || newlyEarned.includes(tier.id),
        newlyEarned: newlyEarned.includes(tier.id),
      })),
    });
  } catch (err) {
    console.error("[rewards] Database error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
