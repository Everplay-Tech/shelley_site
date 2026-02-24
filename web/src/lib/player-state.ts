// Client-side player state — talks to /api/session and /api/game-event.
// Caches progress in memory for fast synchronous reads.
// Session cookie is HttpOnly (managed by server), so this module
// just calls the API and caches responses.

export interface GameProgress {
  gamesPlayed: number;
  gamesCompleted: number;
  gamesSkipped: number;
  totalScore: number;
  totalPicks: number;
  poRelationship: number;
  onboardingComplete: boolean;
  fourthWallUnlocked: boolean;
  gameRecords: Record<string, GameRecord>;
}

export interface GameRecord {
  timesPlayed: number;
  timesCompleted: number;
  highScore: number;
  lastScore: number;
  bestDistance: number;
}

export type GameEventType = "completed" | "skipped" | "score_update" | "onboarding_complete";

export interface GameEvent {
  type: GameEventType;
  gameName?: string;
  score?: number;
  picks?: number;
  distance?: number;
}

// ─── Internal state ─────────────────────────────────────────────────────────

const EMPTY_PROGRESS: GameProgress = {
  gamesPlayed: 0,
  gamesCompleted: 0,
  gamesSkipped: 0,
  totalScore: 0,
  totalPicks: 0,
  poRelationship: 0,
  onboardingComplete: false,
  fourthWallUnlocked: false,
  gameRecords: {},
};

let _progress: GameProgress = { ...EMPTY_PROGRESS };
let _sessionId: string | null = null;
let _initialized = false;
let _initPromise: Promise<void> | null = null;

// Subscribers for React hook integration
type Listener = () => void;
const _listeners = new Set<Listener>();

function _notify() {
  _listeners.forEach((fn) => fn());
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Initialize session on app mount. Idempotent — safe to call multiple times. */
export async function initSession(): Promise<GameProgress> {
  if (_initialized) return _progress;
  if (_initPromise) {
    await _initPromise;
    return _progress;
  }

  _initPromise = fetch("/api/session", { method: "POST" })
    .then((res) => res.json())
    .then((data) => {
      _sessionId = data.sessionId;
      _progress = data.progress ?? { ...EMPTY_PROGRESS };
      _initialized = true;
      _notify();
    })
    .catch((err) => {
      console.warn("[player-state] Session init failed, using defaults:", err);
      _initialized = true;
    });

  await _initPromise;
  return _progress;
}

/** Report a game event to the server. Updates cached progress. */
export async function reportGameEvent(event: GameEvent): Promise<GameProgress> {
  try {
    const res = await fetch("/api/game-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    const data = await res.json();
    if (data.progress) {
      _progress = data.progress;
      _notify();
    }
  } catch (err) {
    console.warn("[player-state] Event report failed:", err);
  }
  return _progress;
}

/** Get cached progress synchronously (fast, no network). */
export function getProgress(): GameProgress {
  return _progress;
}

/** Whether the session has been initialized. */
export function isInitialized(): boolean {
  return _initialized;
}

/** Get the session ID (null until initialized). */
export function getSessionId(): string | null {
  return _sessionId;
}

// ─── React integration (useSyncExternalStore) ───────────────────────────────

export function subscribe(listener: Listener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

export function getSnapshot(): GameProgress {
  return _progress;
}
