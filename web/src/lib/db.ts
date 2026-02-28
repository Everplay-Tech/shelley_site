import { Pool, type QueryResultRow } from "pg";

// Railway injects DATABASE_URL automatically when Postgres is attached.
// For local dev, set it in .env.local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

// ─── Auto-migration ────────────────────────────────────────────────────────
// Ensures schema is up to date on first query after deploy.
// Runs once per process lifetime — zero overhead after init.
let _schemaReady = false;
let _schemaPromise: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (_schemaReady) return;
  if (_schemaPromise) return _schemaPromise;

  _schemaPromise = initSchema()
    .then(() => {
      _schemaReady = true;
    })
    .catch((err) => {
      // Don't block the app if migration fails — log and continue.
      // Queries may still work if schema was already set up manually.
      console.warn("[db] Auto-migration failed (schema may already exist):", err?.message);
      _schemaReady = true; // Don't retry every request
    });

  return _schemaPromise;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  await ensureSchema();
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
      pieces_collected INTEGER DEFAULT 0,
      game_records JSONB DEFAULT '{}',
      reward_code TEXT DEFAULT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add pieces_collected column if table already exists (safe migration)
    ALTER TABLE game_progress ADD COLUMN IF NOT EXISTS pieces_collected INTEGER DEFAULT 0;
    ALTER TABLE game_progress ADD COLUMN IF NOT EXISTS reward_code TEXT DEFAULT NULL;

    -- Narrative overrides — admin-editable dialogue for each beat
    CREATE TABLE IF NOT EXISTS narrative_overrides (
      id SERIAL PRIMARY KEY,
      beat_id TEXT UNIQUE NOT NULL,
      lines JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      updated_by TEXT DEFAULT 'admin'
    );

    -- Index for fast session lookups
    CREATE INDEX IF NOT EXISTS idx_game_progress_session
      ON game_progress(session_id);

    -- Index for account lookups
    CREATE INDEX IF NOT EXISTS idx_game_progress_account
      ON game_progress(account_id);
  `);
}
