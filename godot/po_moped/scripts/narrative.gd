extends Node
## Narrative — time-based story beats for returning users.
## 2 short beats: one near start, one later. Minimal dialogue.

var beats := [
	{
		"id": "return_greeting",
		"trigger_time": 10.0,
		"text": "These guitars... they never found their player.\nLet's set them free, yeah?",
		"duration": 4.0
	},
	{
		"id": "flying_v_warning",
		"trigger_time": 55.0,
		"text": "Something big is coming.\nI can feel the bass in my bones... wait, I don't have bones.\nOkay I DO have bones. I'm literally a skeleton.",
		"duration": 5.0
	}
]

var _game_time := 0.0
var _beat_index := 0
var _showing := false
var _show_timer := 0.0
var _label: Label = null
var _bg: ColorRect = null

@onready var web_bridge = get_node_or_null("../WebBridge")

func _ready() -> void:
	# Create narrative overlay (hidden)
	_bg = ColorRect.new()
	_bg.size = Vector2(400, 50)
	_bg.position = Vector2(120, 290)
	_bg.color = Color(0.0, 0.0, 0.0, 0.7)
	_bg.z_index = 30
	_bg.visible = false
	get_parent().add_child(_bg)

	_label = Label.new()
	_label.position = Vector2(130, 295)
	_label.size = Vector2(380, 45)
	_label.add_theme_font_size_override("font_size", 8)
	_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.3, 1.0))
	_label.z_index = 31
	_label.visible = false
	get_parent().add_child(_label)

func _process(delta: float) -> void:
	_game_time += delta

	# Check for next beat
	if _beat_index < beats.size() and not _showing:
		var beat = beats[_beat_index]
		if _game_time >= beat["trigger_time"]:
			_show_beat(beat)

	# Hide timer
	if _showing:
		_show_timer -= delta
		if _show_timer <= 0.0:
			_hide_beat()

func _show_beat(beat: Dictionary) -> void:
	_showing = true
	_show_timer = beat["duration"]
	_label.text = beat["text"]
	_bg.visible = true
	_label.visible = true

	# Fade in
	_bg.modulate.a = 0.0
	_label.modulate.a = 0.0
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(_bg, "modulate:a", 1.0, 0.3)
	tw.tween_property(_label, "modulate:a", 1.0, 0.3)

	if web_bridge:
		web_bridge.send_narrative_start(beat["id"])

func _hide_beat() -> void:
	_showing = false
	_beat_index += 1

	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(_bg, "modulate:a", 0.0, 0.3)
	tw.tween_property(_label, "modulate:a", 0.0, 0.3)
	tw.chain().tween_callback(func():
		_bg.visible = false
		_label.visible = false
	)

	var beat_id = beats[_beat_index - 1]["id"] if _beat_index > 0 else ""
	if web_bridge and beat_id != "":
		web_bridge.send_narrative_end(beat_id)

func reset() -> void:
	_game_time = 0.0
	_beat_index = 0
	_showing = false
	_bg.visible = false
	_label.visible = false
