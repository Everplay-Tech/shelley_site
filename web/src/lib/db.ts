import { Pool, type QueryResultRow } from "pg";

// Railway injects DATABASE_URL automatically when Postgres is attached.
// For local dev, set it in .env.local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return pool.query<T>(text, params);
}

// Run this once to set up the schema.
// Called from /api/setup or manually.
export async function initSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      rewards_earned TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS game_progress (
      id SERIAL PRIMARY KEY,
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      games_played INTEGER DEFAULT 0,
      games_completed INTEGER DEFAULT 0,
      games_skipped INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      total_picks INTEGER DEFAULT 0,
      po_relationship INTEGER DEFAULT 0,
      onboarding_complete BOOLEAN DEFAULT FALSE,
      fourth_wall_unlocked BOOLEAN DEFAULT FALSE,
      game_records JSONB DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Index for fast session lookups
    CREATE INDEX IF NOT EXISTS idx_game_progress_session
      ON game_progress(session_id);

    -- Index for account lookups
    CREATE INDEX IF NOT EXISTS idx_game_progress_account
      ON game_progress(account_id);
  `);
}
