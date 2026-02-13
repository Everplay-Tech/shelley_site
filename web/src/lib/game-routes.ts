// ─── Route → Game mapping ───────────────────────────────────────────────────
// Each route can declare a transition game. When navigating to that route,
// the transition overlay loads the specified game instead of a loading screen.
// Games are served from /games/{gameName}/index.html (Godot HTML5 exports).

export interface RouteGameConfig {
  /** Godot game name — maps to /games/{gameName}/ */
  gameName: string;
  /** Display label shown during transition */
  label: string;
}

/** Per-route transition games. Routes not listed here use no transition. */
const ROUTE_GAMES: Record<string, RouteGameConfig> = {
  "/workshop": {
    gameName: "workshop_craft",
    label: "Entering the Workshop...",
  },
  "/gallery": {
    gameName: "gallery_run",
    label: "Heading to the Gallery...",
  },
  "/about": {
    gameName: "about_quest",
    label: "Learning the Story...",
  },
  "/contact": {
    gameName: "contact_dash",
    label: "Reaching Out...",
  },
};

/** Landing page games — swapped based on whether the user has visited before */
export const LANDING_GAMES = {
  firstVisit: {
    gameName: "po_runner",
    label: "Meet Po...",
  },
  returning: {
    gameName: "po_moped",
    label: "Po rides again!",
  },
} as const;

/** Cookie name used to track onboarding completion */
export const ONBOARDING_COOKIE = "shelley_onboarded";

export function getGameForRoute(route: string): RouteGameConfig | null {
  return ROUTE_GAMES[route] ?? null;
}

export function getLandingGame(isReturningUser: boolean): RouteGameConfig {
  return isReturningUser ? LANDING_GAMES.returning : LANDING_GAMES.firstVisit;
}
