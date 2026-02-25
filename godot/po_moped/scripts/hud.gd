extends CanvasLayer
## HUD — health hearts, score, combo multiplier, game over panel.
## Brand colors: wood=#4a3728, amber=#ffbf00, charcoal=#1a1a1a.

signal restart_requested

const HEART_FULL := Color(1.0, 0.749, 0.0, 1.0)   # Amber
const HEART_EMPTY := Color(0.1, 0.1, 0.1, 0.6)
const HEART_FLASH := Color(1.0, 1.0, 1.0, 1.0)
const HEART_SIZE := Vector2(12, 10)
const MAX_HEARTS := 3
const AMBER := Color(1.0, 0.749, 0.0, 1.0)
const CHARCOAL := Color(0.1, 0.1, 0.1, 1.0)

var _hearts: Array[ColorRect] = []
var _prev_health := MAX_HEARTS
var _game_over_visible := false
var _combo := 1
var _combo_display_timer := 0.0

@onready var heart_container: HBoxContainer = $HeartContainer
@onready var score_label: Label = $ScoreLabel
@onready var combo_label: Label = $ComboLabel
@onready var game_over_panel: PanelContainer = $GameOverPanel
@onready var game_over_score: Label = $GameOverPanel/VBox/ScoreValue
@onready var game_over_tap: Label = $GameOverPanel/VBox/TapLabel

func _ready() -> void:
	for i in range(MAX_HEARTS):
		var heart = ColorRect.new()
		heart.custom_minimum_size = HEART_SIZE
		heart.size = HEART_SIZE
		heart.color = HEART_FULL
		heart_container.add_child(heart)
		_hearts.append(heart)
	game_over_panel.visible = false
	combo_label.visible = false
	_blink_tap_label()

func _process(delta: float) -> void:
	if _combo_display_timer > 0.0:
		_combo_display_timer -= delta
		if _combo_display_timer <= 0.0:
			combo_label.visible = false

func _input(event: InputEvent) -> void:
	if not _game_over_visible:
		return
	if event is InputEventScreenTouch and event.pressed:
		restart_requested.emit()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("shoot") or event.is_action_pressed("ui_accept"):
		restart_requested.emit()
		get_viewport().set_input_as_handled()

func update_hearts(current: int, _max_val: int) -> void:
	for i in range(MAX_HEARTS):
		if i < current:
			if i >= _prev_health:
				_flash_heart(i, Color(0.4, 1.0, 0.6), HEART_FULL)
			else:
				_hearts[i].color = HEART_FULL
		else:
			if i < _prev_health:
				_flash_heart(i, HEART_FLASH, HEART_EMPTY)
			else:
				_hearts[i].color = HEART_EMPTY
	_prev_health = current

func _flash_heart(idx: int, flash_color: Color, end_color: Color) -> void:
	var heart = _hearts[idx]
	heart.color = flash_color
	var tw = create_tween()
	tw.tween_property(heart, "color", end_color, 0.25)

func update_score(value: int) -> void:
	score_label.text = str(value)

func show_combo(multiplier: int) -> void:
	_combo = multiplier
	if multiplier > 1:
		combo_label.text = "x%d" % multiplier
		combo_label.visible = true
		_combo_display_timer = 2.0
		# Pop animation
		combo_label.scale = Vector2(1.5, 1.5)
		var tw = create_tween()
		tw.tween_property(combo_label, "scale", Vector2(1.0, 1.0), 0.15)
	else:
		combo_label.visible = false

func show_game_over(final_score: int) -> void:
	_game_over_visible = true
	game_over_score.text = str(final_score)
	game_over_panel.visible = true
	game_over_panel.modulate.a = 0.0
	var tw = create_tween()
	tw.tween_property(game_over_panel, "modulate:a", 1.0, 0.5)

func _blink_tap_label() -> void:
	if not is_inside_tree():
		return
	var tw = create_tween().set_loops()
	tw.tween_property(game_over_tap, "modulate:a", 0.2, 0.5)
	tw.tween_property(game_over_tap, "modulate:a", 1.0, 0.5)

func hide_game_over() -> void:
	_game_over_visible = false
	game_over_panel.visible = false
	_prev_health = MAX_HEARTS
