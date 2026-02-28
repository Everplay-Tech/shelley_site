// ─── Commands: Host → Godot ─────────────────────────────────────────────────

export interface StartCommand {
  command: "start";
  data?: { level?: string; mode?: "standard" | "ng_plus" };
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

export interface VirtualInputCommand {
  command:
    | "jump_press"
    | "jump_release"
    | "slide_press"
    | "slide_release"
    | "advance_press"
    | "advance_release"
    | "attack1_press"
    | "attack1_release"
    | "move_left_press"
    | "move_left_release"
    | "move_right_press"
    | "move_right_release";
}

export interface NarrativeOverrideCommand {
  command: "update_narrative";
  data: {
    beats: Array<{
      id: string;
      lines: Array<string | { speaker: string; text: string }>;
    }>;
  };
}

export type GodotCommand =
  | StartCommand
  | PauseCommand
  | ResumeCommand
  | MoveToCommand
  | ConfigCommand
  | VirtualInputCommand
  | NarrativeOverrideCommand;

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

export interface GameOverEvent {
  type: "game_over";
  data: { score: number; distance: number };
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

export interface PieceCollectedEvent {
  type: "piece_collected";
  data: { piece: number; total: number };
}

export interface MorphToPlatformerEvent {
  type: "morph_to_platformer";
}

export interface MorphCompleteEvent {
  type: "morph_complete";
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
  | GameOverEvent
  | GameSessionEvent
  | PieceCollectedEvent
  | MorphToPlatformerEvent
  | MorphCompleteEvent;

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
  "game_over",
  "game_session",
  "piece_collected",
  "morph_to_platformer",
  "morph_complete",
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
