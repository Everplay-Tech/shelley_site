export type GodotCommandType = "start" | "pause" | "move_to";

export interface GodotCommand {
  command: GodotCommandType;
  data?: any;
}

export type GodotEventType = "navigate" | "minigame_complete" | "player_state";

export interface GodotEvent {
  type: GodotEventType;
  data?: any;
}
