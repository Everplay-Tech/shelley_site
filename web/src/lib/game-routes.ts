// ─── Route → Game mapping ───────────────────────────────────────────────────
// Config-driven: reads from /config/games.json at startup.
// Falls back to hardcoded defaults if fetch fails (offline resilience).
// Games are served from /games/{gameName}/index.html (Godot HTML5 exports).

export interface RouteGameConfig {
  /** Godot game name — maps to /games/{gameName}/ */
  gameName: string;
  /** Display label shown during transition */
  label: string;
  /** Whether this game is currently available */
  available?: boolean;
  /** Whether the skip button is shown */
  skipAllowed?: boolean;
  /** Score multiplier for reward calculations */
  rewardMultiplier?: number;
}

interface GamesConfig {
  version: number;
  routes: Record<string, RouteGameConfig>;
  landing: {
    firstVisit: RouteGameConfig;
    returning: RouteGameConfig;
  };
}

// ─── Hardcoded defaults (used if config fetch fails) ────────────────────────

const DEFAULT_CONFIG: GamesConfig = {
  version: 1,
  routes: {
    "/workshop": { gameName: "workshop_craft", label: "Entering the Workshop...", available: false },
    "/gallery": { gameName: "gallery_run", label: "Heading to the Gallery...", available: false },
    "/librarynth": { gameName: "librarynth_quest", label: "Entering the Librarynth...", available: false },
    "/contact": { gameName: "contact_dash", label: "Reaching Out...", available: false },
  },
  landing: {
    firstVisit: { gameName: "po_runner", label: "Meet Po...", available: true },
    returning: { gameName: "po_moped", label: "Po rides again!", available: false },
  },
};

// ─── Config loader ──────────────────────────────────────────────────────────

let _config: GamesConfig | null = null;
let _loading: Promise<GamesConfig> | null = null;

export async function loadGamesConfig(): Promise<GamesConfig> {
  if (_config) return _config;
  if (_loading) return _loading;

  _loading = fetch("/config/games.json")
    .then((res) => res.json())
    .then((data: GamesConfig) => {
      _config = data;
      return _config;
    })
    .catch(() => {
      _config = DEFAULT_CONFIG;
      return _config;
    });

  return _loading;
}

// ─── Synchronous getters (use cached config or defaults) ────────────────────

/** Cookie name used to track onboarding completion */
export const ONBOARDING_COOKIE = "shelley_onboarded";

/** Landing page games — swapped based on whether the user has visited before */
export const LANDING_GAMES = {
  get firstVisit() {
    return (_config ?? DEFAULT_CONFIG).landing.firstVisit;
  },
  get returning() {
    return (_config ?? DEFAULT_CONFIG).landing.returning;
  },
};

export function getGameForRoute(route: string): RouteGameConfig | null {
  const config = _config ?? DEFAULT_CONFIG;
  const entry = config.routes[route];
  if (!entry || entry.available === false) return null;
  return entry;
}

export function getLandingGame(isReturningUser: boolean): RouteGameConfig {
  const config = _config ?? DEFAULT_CONFIG;
  const game = isReturningUser ? config.landing.returning : config.landing.firstVisit;
  // If the returning game isn't available, fall back to first visit
  if (isReturningUser && game.available === false) {
    return config.landing.firstVisit;
  }
  return game;
}
