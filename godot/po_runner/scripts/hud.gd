extends CanvasLayer
## HUD — health hearts, distance, score, trophy tracker, game over panel.
## Brand colors: wood=#4a3728, amber=#ffbf00, charcoal=#1a1a1a.

signal restart_requested

const HEART_FULL := Color(1.0, 0.749, 0.0, 1.0)   # Amber #ffbf00
const HEART_EMPTY := Color(0.1, 0.1, 0.1, 0.6)     # Charcoal transparent
const HEART_FLASH := Color(1.0, 1.0, 1.0, 1.0)     # White flash on damage
const HEART_HEAL := Color(0.4, 1.0, 0.6, 1.0)      # Green flash on heal
const HEART_SIZE := Vector2(12, 10)
const HEART_SPACING := 3.0
const MAX_HEARTS := 5

const WOOD_COLOR := Color(0.29, 0.216, 0.157, 1.0)  # #4a3728
const AMBER_COLOR := Color(1.0, 0.749, 0.0, 1.0)    # #ffbf00
const CHARCOAL := Color(0.1, 0.1, 0.1, 1.0)         # #1a1a1a

var _hearts: Array[ColorRect] = []
var _prev_health := MAX_HEARTS
var _game_over_visible := false
var _trophies: Dictionary = {}  # food_name → {node, count_label, count}

@onready var heart_container: HBoxContainer = $HeartContainer
@onready var distance_label: Label = $DistanceLabel
@onready var score_panel: HBoxContainer = $ScorePanel
@onready var score_label: Label = $ScorePanel/ScoreLabel
@onready var trophy_container: HBoxContainer = $TrophyContainer
@onready var game_over_panel: PanelContainer = $GameOverPanel
@onready var game_over_score: Label = $GameOverPanel/VBox/ScoreValue
@onready var game_over_distance: Label = $GameOverPanel/VBox/DistanceValue
@onready var game_over_tap: Label = $GameOverPanel/VBox/TapLabel
@onready var danger_vignette: ColorRect = $DangerVignette

func _ready() -> void:
	# Build hearts
	for i in range(MAX_HEARTS):
		var heart = ColorRect.new()
		heart.custom_minimum_size = HEART_SIZE
		heart.size = HEART_SIZE
		heart.color = HEART_FULL
		heart_container.add_child(heart)
		_hearts.append(heart)

	# Hide game over panel
	game_over_panel.visible = false
	danger_vignette.visible = false

	# Start blinking "TAP TO RUN AGAIN"
	_blink_tap_label()

func _input(event: InputEvent) -> void:
	if not _game_over_visible:
		return
	if event is InputEventScreenTouch and event.pressed:
		restart_requested.emit()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("jump") or event.is_action_pressed("advance"):
		restart_requested.emit()
		get_viewport().set_input_as_handled()

# ---- Health Hearts ----

func update_hearts(current: int, _max_val: int) -> void:
	for i in range(MAX_HEARTS):
		if i < current:
			# Full heart — if this was previously empty, flash green (heal)
			if i >= _prev_health:
				_flash_heart(i, HEART_HEAL, HEART_FULL)
			else:
				_hearts[i].color = HEART_FULL
		else:
			# Empty heart — if this was previously full, flash white (damage)
			if i < _prev_health:
				_flash_heart(i, HEART_FLASH, HEART_EMPTY)
			else:
				_hearts[i].color = HEART_EMPTY
	_prev_health = current

func _flash_heart(idx: int, flash_color: Color, end_color: Color) -> void:
	var heart = _hearts[idx]
	heart.color = flash_color
	var tween = create_tween()
	tween.tween_property(heart, "color", end_color, 0.25)

# ---- Score & Distance ----

func update_score(value: int) -> void:
	score_label.text = str(value)

func update_distance(meters: int) -> void:
	distance_label.text = "%dm" % meters

# ---- Trophy Tracker ----

func add_trophy(food_name: String) -> void:
	if food_name == "":
		return
	if _trophies.has(food_name):
		# Increment count
		var t = _trophies[food_name]
		t["count"] += 1
		t["count_label"].text = "x%d" % t["count"]
		# Pop animation
		var node: HBoxContainer = t["node"]
		var tween = create_tween()
		tween.tween_property(node, "scale", Vector2(1.2, 1.2), 0.06)
		tween.tween_property(node, "scale", Vector2(1.0, 1.0), 0.1)
	else:
		# New trophy — create icon + count
		var entry = HBoxContainer.new()
		entry.add_theme_constant_override("separation", 1)

		var icon = ColorRect.new()
		icon.custom_minimum_size = Vector2(8, 8)
		icon.size = Vector2(8, 8)
		icon.color = _trophy_color(food_name)
		entry.add_child(icon)

		var count_lbl = Label.new()
		count_lbl.text = "x1"
		count_lbl.add_theme_font_size_override("font_size", 8)
		entry.add_child(count_lbl)

		trophy_container.add_child(entry)
		_trophies[food_name] = {"node": entry, "count_label": count_lbl, "count": 1}

		# Appear animation — pop in from zero
		entry.scale = Vector2.ZERO
		entry.pivot_offset = Vector2(12, 6)
		var tween = create_tween()
		tween.tween_property(entry, "scale", Vector2(1.3, 1.3), 0.08)
		tween.tween_property(entry, "scale", Vector2(1.0, 1.0), 0.12)

func _trophy_color(food_name: String) -> Color:
	match food_name:
		"ramen": return Color(0.9, 0.75, 0.3, 1.0)       # Golden noodle
		"toaster_strudel": return Color(0.85, 0.65, 0.4, 1.0)  # Pastry brown
		"coffee": return Color(0.55, 0.35, 0.2, 1.0)      # Coffee brown
		"cavatappi": return Color(0.95, 0.85, 0.5, 1.0)   # Pasta yellow
		"blt": return Color(0.8, 0.3, 0.2, 1.0)           # Tomato red
		"smoothie": return Color(0.5, 0.8, 0.4, 1.0)      # Green smoothie
		_: return AMBER_COLOR

# ---- Game Over Panel ----

func show_game_over(final_score: int, final_distance: int) -> void:
	_game_over_visible = true
	game_over_score.text = str(final_score)
	game_over_distance.text = "%dm" % final_distance
	game_over_panel.visible = true
	# Fade in
	game_over_panel.modulate.a = 0.0
	var tween = create_tween()
	tween.tween_property(game_over_panel, "modulate:a", 1.0, 0.5)

func _blink_tap_label() -> void:
	if not is_inside_tree():
		return
	var tween = create_tween().set_loops()
	tween.tween_property(game_over_tap, "modulate:a", 0.2, 0.5)
	tween.tween_property(game_over_tap, "modulate:a", 1.0, 0.5)

# ---- Danger Vignette (attack telegraph) ----

func flash_danger() -> void:
	danger_vignette.modulate.a = 0.0
	danger_vignette.visible = true
	var tween = create_tween()
	tween.tween_property(danger_vignette, "modulate:a", 0.2, 0.08)
	tween.tween_property(danger_vignette, "modulate:a", 0.0, 0.3)
	tween.tween_callback(func(): danger_vignette.visible = false)
