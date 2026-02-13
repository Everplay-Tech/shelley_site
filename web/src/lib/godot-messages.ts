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

export type GodotCommand = StartCommand | PauseCommand | ResumeCommand | MoveToCommand;

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

export type GodotEvent =
  | NavigateEvent
  | MiniGameCompleteEvent
  | PlayerStateEvent
  | GameReadyEvent
  | GameErrorEvent;

export type GodotEventType = GodotEvent["type"];

// ─── Message validation ─────────────────────────────────────────────────────

const VALID_EVENT_TYPES: ReadonlySet<string> = new Set([
  "navigate",
  "minigame_complete",
  "player_state",
  "game_ready",
  "game_error",
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
