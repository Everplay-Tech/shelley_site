// ─── Commands: Host → Godot ─────────────────────────────────────────────────

export interface StartCommand {
  command: "start";
  data?: { level?: string };
}

export interface PauseCommand {
  command: "pause";
}

export interface ResumeCommand {
  command: "resume";
}

export interface MoveToCommand {
  command: "move_to";
  data: { target: string }; // e.g. "workshop", "gallery"
}

export interface ConfigCommand {
  command: "config";
  data: {
    relationshipLevel?: number;
    gamesPlayed?: number;
    fourthWallUnlocked?: boolean;
    features?: Record<string, boolean>;
  };
}

export type GodotCommand = StartCommand | PauseCommand | ResumeCommand | MoveToCommand | ConfigCommand;

export type GodotCommandType = GodotCommand["command"];

// ─── Events: Godot → Host ───────────────────────────────────────────────────

export interface NavigateEvent {
  type: "navigate";
  data: { route: string }; // e.g. "/workshop"
}

export interface MiniGameCompleteEvent {
  type: "minigame_complete";
  data: { score: number; skipped: boolean };
}

export interface PlayerStateEvent {
  type: "player_state";
  data: {
    mood: string;
    score: number;
    action: string;
  };
}

export interface GameReadyEvent {
  type: "game_ready";
}

export interface GameErrorEvent {
  type: "game_error";
  data: { message: string };
}

export interface NarrativeStartEvent {
  type: "narrative_start";
  data: { beatId: string };
}

export interface NarrativeEndEvent {
  type: "narrative_end";
  data: { beatId: string };
}

export interface OnboardingCompleteEvent {
  type: "onboarding_complete";
}

export interface ScoreUpdateEvent {
  type: "score_update";
  data: { score: number; picks: number; distance: number };
}

export interface GameSessionEvent {
  type: "game_session";
  data: {
    action: "started" | "completed" | "skipped";
    gameName: string;
    finalScore: number;
    duration: number;
  };
}

export type GodotEvent =
  | NavigateEvent
  | MiniGameCompleteEvent
  | PlayerStateEvent
  | GameReadyEvent
  | GameErrorEvent
  | NarrativeStartEvent
  | NarrativeEndEvent
  | OnboardingCompleteEvent
  | ScoreUpdateEvent
  | GameSessionEvent;

export type GodotEventType = GodotEvent["type"];

// ─── Message validation ─────────────────────────────────────────────────────

const VALID_EVENT_TYPES: ReadonlySet<string> = new Set([
  "navigate",
  "minigame_complete",
  "player_state",
  "game_ready",
  "game_error",
  "narrative_start",
  "narrative_end",
  "onboarding_complete",
  "score_update",
  "game_session",
]);

export function isGodotEvent(data: unknown): data is GodotEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    typeof (data as Record<string, unknown>).type === "string" &&
    VALID_EVENT_TYPES.has((data as Record<string, unknown>).type as string)
  );
}
