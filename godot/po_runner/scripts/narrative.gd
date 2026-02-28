extends Node
## Manages narrative beats — triggers pauses at distance milestones,
## shows speech bubbles, advances on input.
## Extended: quick lines (no pause), morph trigger, post-morph beats,
## area-entered triggers, timer-based triggers.

signal narrative_started(beat_id: String)
signal narrative_ended(beat_id: String)
signal speaker_changed(speaker_name: String)  # For HUD speaker label
signal onboarding_complete
signal morph_to_platformer

var beats: Array = []
var current_beat_index := 0
var is_active := false
var current_line_index := 0
var all_beats_done := false

# Press-to-reveal: each A press reveals a growing chunk of text.
# Counter escalates across the whole beat (resets per beat).
const REVEAL_CHUNKS: Array[int] = [1, 2, 3, 5, -1]  # -1 = rest of line
var _reveal_step := 0

# Post-morph state
var _morph_complete := false
var _post_morph_timer := 0.0
var _post_morph_beats_started := false

# Quick line state (no-pause speech bubble)
var _quick_line_active := false
var _quick_line_timer := 0.0
const QUICK_LINE_DURATION := 2.5

@onready var speech_bubble: Control = %SpeechBubble
@onready var speech_label: RichTextLabel = %SpeechLabel

func _ready() -> void:
	_load_beats()
	speech_bubble.visible = false

func _load_beats() -> void:
	var file = FileAccess.open("res://data/narrative_beats.json", FileAccess.READ)
	if file:
		var json = JSON.parse_string(file.get_as_text())
		if json is Array:
			beats = json
		file.close()
	else:
		push_warning("Could not load narrative_beats.json")

func override_beats(overrides: Array) -> void:
	## Apply CMS overrides — replace lines for matching beat IDs.
	## Called by main.gd when the host sends "update_narrative" command.
	## Only replaces lines; triggers/signals stay as loaded from bundled JSON.
	for override in overrides:
		if not override is Dictionary:
			continue
		var beat_id = override.get("id", "")
		var new_lines = override.get("lines", [])
		if beat_id == "" or new_lines.size() == 0:
			continue
		for i in range(beats.size()):
			if beats[i].get("id", "") == beat_id:
				beats[i]["lines"] = new_lines
				print("[Narrative] CMS override applied: ", beat_id)
				break

func _process(delta: float) -> void:
	# Quick line auto-dismiss
	if _quick_line_active:
		_quick_line_timer -= delta
		if _quick_line_timer <= 0:
			_dismiss_quick_line()

	# Post-morph timer beats
	if _morph_complete and not is_active:
		_post_morph_timer += delta
		_check_post_morph_beats()

func check_distance(distance: float) -> void:
	if all_beats_done or is_active:
		return
	if current_beat_index >= beats.size():
		return

	var beat = beats[current_beat_index]
	var trigger_type = beat.get("trigger_type", "distance")

	# Only process distance-triggered beats here
	if trigger_type != "distance":
		return
	if distance >= beat.get("trigger_distance", 99999):
		_start_beat(beat)

func trigger_morph_beat() -> void:
	## Called by main.gd when all 6 artifacts collected.
	## Finds and triggers the "the_break" beat regardless of current index.
	for i in range(beats.size()):
		if beats[i].get("id", "") == "the_break":
			current_beat_index = i
			_start_beat(beats[i])
			return
	push_warning("Could not find 'the_break' beat in narrative_beats.json")

func notify_morph_complete() -> void:
	## Called after the morph transition is done — enables post-morph beats.
	_morph_complete = true
	_post_morph_timer = 0.0

func notify_area_entered(area_name: String) -> void:
	## Called when Po enters a named area (e.g., "door") — triggers matching beats.
	if is_active or all_beats_done:
		return
	for i in range(current_beat_index, beats.size()):
		var beat = beats[i]
		if beat.get("trigger_type", "") == "area_entered" and beat.get("trigger_area", "") == area_name:
			current_beat_index = i
			_start_beat(beat)
			return

func _check_post_morph_beats() -> void:
	## Check for timer-based post-morph beats.
	for i in range(current_beat_index, beats.size()):
		var beat = beats[i]
		if beat.get("trigger_type", "") == "post_morph_timer":
			var delay = beat.get("trigger_delay", 999)
			if _post_morph_timer >= delay:
				current_beat_index = i
				_start_beat(beat)
				return

# ============================================================
# STANDARD BEATS — Pause game, show dialogue, advance on input
# ============================================================

func _start_beat(beat: Dictionary) -> void:
	is_active = true
	current_line_index = 0
	_reveal_step = 0  # Reset reveal counter per beat
	narrative_started.emit(beat.get("id", ""))
	_show_line(beat)

func _show_line(beat: Dictionary) -> void:
	var lines = beat.get("lines", [])
	if current_line_index >= lines.size():
		_end_beat(beat)
		return

	# Multi-speaker support: lines can be String or Dictionary
	var line_entry = lines[current_line_index]
	var text: String
	var speaker: String = "Po"
	if line_entry is Dictionary:
		text = line_entry.get("text", "")
		speaker = line_entry.get("speaker", "Po")
	else:
		text = str(line_entry)

	speech_bubble.visible = true
	speech_label.text = text
	speech_label.visible_characters = 0  # Start hidden — player presses A to reveal
	speaker_changed.emit(speaker)

func _input(event: InputEvent) -> void:
	if not is_active:
		return
	# Quick line — dismiss on any input
	if _quick_line_active:
		_dismiss_quick_line()
		return
	# Touch support — tap to advance dialogue
	if event is InputEventScreenTouch and not event.pressed:
		_advance_text()
		get_viewport().set_input_as_handled()
		return
	# Keyboard/mouse support
	if event.is_action_pressed("advance"):
		_advance_text()
		get_viewport().set_input_as_handled()

func _advance_text() -> void:
	var total = speech_label.text.length()
	if speech_label.visible_characters < total:
		# Reveal next chunk — sizes escalate across the whole beat
		var chunk_idx = mini(_reveal_step, REVEAL_CHUNKS.size() - 1)
		var chunk_size = REVEAL_CHUNKS[chunk_idx]
		if chunk_size == -1:
			speech_label.visible_characters = total
		else:
			speech_label.visible_characters = mini(
				speech_label.visible_characters + chunk_size, total
			)
		_reveal_step += 1
		return
	# Line fully revealed — advance to next line
	current_line_index += 1
	var beat = beats[current_beat_index]
	_show_line(beat)

func _end_beat(beat: Dictionary) -> void:
	speech_bubble.visible = false
	is_active = false
	var beat_id = beat.get("id", "")
	narrative_ended.emit(beat_id)

	# Check for special signals
	var sig = beat.get("signal", "")
	match sig:
		"onboarding_complete":
			onboarding_complete.emit()
			all_beats_done = true
		"morph_to_platformer":
			morph_to_platformer.emit()
			# Don't mark all_beats_done — post-morph beats still pending
			notify_morph_complete()

	current_beat_index += 1

# ============================================================
# QUICK LINES — No-pause speech bubble for artifact collection
# ============================================================

func show_quick_line(text: String) -> void:
	## Shows a brief speech bubble without pausing the game.
	## Auto-dismisses after QUICK_LINE_DURATION seconds.
	if is_active:
		return  # Don't interrupt a real narrative beat
	_quick_line_active = true
	_quick_line_timer = QUICK_LINE_DURATION
	speech_bubble.visible = true
	speech_label.text = text
	speech_label.visible_characters = text.length()  # No typewriter for quick lines

func _dismiss_quick_line() -> void:
	_quick_line_active = false
	speech_bubble.visible = false
