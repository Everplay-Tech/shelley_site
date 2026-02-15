extends Node
## Manages narrative beats — triggers pauses at distance milestones,
## shows speech bubbles, advances on input.

signal narrative_started(beat_id: String)
signal narrative_ended(beat_id: String)
signal onboarding_complete

var beats: Array = []
var current_beat_index := 0
var is_active := false
var current_line_index := 0
var all_beats_done := false

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

func check_distance(distance: float) -> void:
	if all_beats_done or is_active:
		return
	if current_beat_index >= beats.size():
		return

	var beat = beats[current_beat_index]
	if distance >= beat.get("trigger_distance", 99999):
		_start_beat(beat)

func _start_beat(beat: Dictionary) -> void:
	is_active = true
	current_line_index = 0
	narrative_started.emit(beat.get("id", ""))
	_show_line(beat)

func _show_line(beat: Dictionary) -> void:
	var lines = beat.get("lines", [])
	if current_line_index >= lines.size():
		_end_beat(beat)
		return

	speech_bubble.visible = true
	speech_label.text = ""

	# Typewriter effect
	var full_text = lines[current_line_index]
	_typewrite(full_text)

func _typewrite(text: String) -> void:
	speech_label.text = ""
	speech_label.visible_characters = 0
	speech_label.text = text
	# Use a tween for the typewriter
	var tween = create_tween()
	tween.tween_property(speech_label, "visible_characters", text.length(), text.length() * 0.03)

func _input(event: InputEvent) -> void:
	if not is_active:
		return
	if event.is_action_pressed("advance"):
		# If text is still typing, show all of it
		if speech_label.visible_characters < speech_label.text.length():
			speech_label.visible_characters = speech_label.text.length()
			return
		# Otherwise advance to next line
		current_line_index += 1
		var beat = beats[current_beat_index]
		_show_line(beat)
		get_viewport().set_input_as_handled()

func _end_beat(beat: Dictionary) -> void:
	speech_bubble.visible = false
	is_active = false
	var beat_id = beat.get("id", "")
	narrative_ended.emit(beat_id)

	# Check for special signals
	if beat.get("signal", "") == "onboarding_complete":
		onboarding_complete.emit()
		all_beats_done = true

	current_beat_index += 1
