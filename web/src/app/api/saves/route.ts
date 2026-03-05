import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { AUTH_COOKIE, verifyAuthToken } from "@/lib/auth-helpers";

interface SaveRow {
  id: number;
  slot: number;
  game_name: string;
  save_label: string;
  save_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

async function getAccountId(): Promise<number | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyAuthToken(token);
    return payload.accountId;
  } catch {
    return null;
  }
}

// GET /api/saves?game=xxx — list saves for a game
export async function GET(req: Request) {
  const accountId = await getAccountId();
  if (!accountId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game");
  if (!game) {
    return NextResponse.json({ error: "game parameter required" }, { status: 400 });
  }

  const result = await query<SaveRow>(
    `SELECT id, slot, game_name, save_label, save_data, created_at, updated_at
     FROM game_saves
     WHERE account_id = $1 AND game_name = $2
     ORDER BY slot`,
    [accountId, game]
  );

  return NextResponse.json({
    saves: result.rows.map((r) => ({
      id: r.id,
      slot: r.slot,
      gameName: r.game_name,
      label: r.save_label,
      saveData: r.save_data,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
}

// POST /api/saves — upsert a save
// Body: { game, slot, label?, saveData }
export async function POST(req: Request) {
  const accountId = await getAccountId();
  if (!accountId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { game, slot, label, saveData } = body;

  if (!game || !slot || !saveData) {
    return NextResponse.json({ error: "game, slot, and saveData required" }, { status: 400 });
  }

  if (slot < 1 || slot > 3) {
    return NextResponse.json({ error: "slot must be 1-3" }, { status: 400 });
  }

  const result = await query<SaveRow>(
    `INSERT INTO game_saves (account_id, game_name, slot, save_label, save_data, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (account_id, game_name, slot)
     DO UPDATE SET save_label = $4, save_data = $5, updated_at = NOW()
     RETURNING id, slot, game_name, save_label, save_data, created_at, updated_at`,
    [accountId, game, slot, label ?? "", JSON.stringify(saveData)]
  );

  const r = result.rows[0];
  return NextResponse.json({
    save: {
      id: r.id,
      slot: r.slot,
      gameName: r.game_name,
      label: r.save_label,
      saveData: r.save_data,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    },
  });
}

// DELETE /api/saves — remove a save
// Body: { game, slot }
export async function DELETE(req: Request) {
  const accountId = await getAccountId();
  if (!accountId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { game, slot } = body;

  if (!game || !slot) {
    return NextResponse.json({ error: "game and slot required" }, { status: 400 });
  }

  await query(
    "DELETE FROM game_saves WHERE account_id = $1 AND game_name = $2 AND slot = $3",
    [accountId, game, slot]
  );

  return NextResponse.json({ ok: true });
}
