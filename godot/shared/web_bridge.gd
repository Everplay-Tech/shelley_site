extends Node
## Standard web bridge for Shelley Site games.
## Handles postMessage communication between Godot and the host website.
## Copy this into your game project and add as a child of the main scene.
## See GAME_INTERFACE.md for the full contract.

signal host_command_received(command: String, data: Dictionary)

## Player config received from the host (relationship, features, etc.)
## Populated when the host sends a "config" command after game_ready.
var player_config: Dictionary = {}

func _ready() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("""
			window.addEventListener('message', function(e) {
				if (e.data && e.data.command) {
					if (!window._godotCommands) window._godotCommands = [];
					window._godotCommands.push(JSON.stringify(e.data));
				}
			});
			window._godotCommands = [];
		""")

func _process(_delta: float) -> void:
	if OS.has_feature("web"):
		_poll_commands()

func _poll_commands() -> void:
	var result = JavaScriptBridge.eval("""
		var cmds = window._godotCommands || [];
		window._godotCommands = [];
		JSON.stringify(cmds);
	""")
	if result and result != "[]":
		var commands = JSON.parse_string(result)
		if commands is Array:
			for cmd_str in commands:
				var cmd = JSON.parse_string(cmd_str)
				if cmd is Dictionary and cmd.has("command"):
					var data = cmd.get("data", {})
					if not data is Dictionary:
						data = {}
					# Store config data for game scripts to read
					if cmd["command"] == "config":
						player_config = data
					host_command_received.emit(cmd["command"], data)

# ─── Send events to host ────────────────────────────────────────────────────

func send_event(event_data: Dictionary) -> void:
	if OS.has_feature("web"):
		var json = JSON.stringify(event_data)
		JavaScriptBridge.eval("window.parent.postMessage(%s, '*')" % json)
	else:
		print("[WebBridge] Would send: ", event_data)

# ─── Required events (every game must send these) ───────────────────────────

func send_game_ready() -> void:
	send_event({"type": "game_ready"})

func send_minigame_complete(score: int, skipped: bool) -> void:
	send_event({
		"type": "minigame_complete",
		"data": {"score": score, "skipped": skipped}
	})

func send_game_error(message: String) -> void:
	send_event({
		"type": "game_error",
		"data": {"message": message}
	})

# ─── Optional events (use as needed) ────────────────────────────────────────

func send_player_state(mood: String, score: int, action: String) -> void:
	send_event({
		"type": "player_state",
		"data": {"mood": mood, "score": score, "action": action}
	})

func send_narrative_start(beat_id: String) -> void:
	send_event({
		"type": "narrative_start",
		"data": {"beatId": beat_id}
	})

func send_narrative_end(beat_id: String) -> void:
	send_event({
		"type": "narrative_end",
		"data": {"beatId": beat_id}
	})

func send_onboarding_complete() -> void:
	send_event({"type": "onboarding_complete"})

func send_score_update(score: int, picks: int, distance: float) -> void:
	send_event({
		"type": "score_update",
		"data": {"score": score, "picks": picks, "distance": distance}
	})
