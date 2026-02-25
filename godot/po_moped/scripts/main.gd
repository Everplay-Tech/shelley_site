extends Node2D
## po_moped — Main game loop. Space invader variant.
## Po on moped shoots haunted guitars to liberate them.
## Scoring with combo multiplier, time-based difficulty ramp, boss encounters.

const STAR_COUNT := 40
const WISP_COUNT := 12
const BG_COLOR := Color(0.06, 0.04, 0.1, 1.0)  # Dark djinn sky

var score := 0
var combo := 1
var combo_count := 0
var game_active := false
var _screen_shake := 0.0
var _shake_decay := 10.0
var _original_cam_pos := Vector2.ZERO

# Ambient VFX
var _wisps: Array[Dictionary] = []
var _stars: Array[Dictionary] = []
var _parallax_timer := 0.0

@onready var po: Area2D = $PoMoped
@onready var spawner: Node2D = $GuitarSpawner
@onready var hud: CanvasLayer = $HUD
@onready var web_bridge: Node = $WebBridge
@onready var camera: Camera2D = $Camera2D

func _ready() -> void:
	# Background color
	RenderingServer.set_default_clear_color(BG_COLOR)

	# Connect signals
	po.health_changed.connect(hud.update_hearts)
	po.died.connect(_on_player_died)
	spawner.enemy_defeated.connect(_on_enemy_defeated)
	spawner.powerup_dropped.connect(_on_powerup_dropped)
	spawner.boss_defeated.connect(_on_boss_defeated)
	hud.restart_requested.connect(_restart)

	# Create ambient star field
	_create_stars()
	_create_wisps()

	# Send game ready
	web_bridge.send_game_ready()

	# Start game
	_start_game()

func _start_game() -> void:
	score = 0
	combo = 1
	combo_count = 0
	game_active = true
	po.reset()
	hud.update_score(0)
	hud.show_combo(1)
	hud.hide_game_over()
	spawner.start()

func _process(delta: float) -> void:
	_update_stars(delta)
	_update_wisps(delta)
	_update_screen_shake(delta)

func _on_enemy_defeated(points: int, pos: Vector2) -> void:
	if not game_active:
		return
	# Combo system — consecutive kills build multiplier
	combo_count += 1
	if combo_count >= 3:
		combo = mini(combo + 1, 4)
		combo_count = 0

	var awarded = points * combo
	score += awarded
	hud.update_score(score)
	hud.show_combo(combo)

	# Floating score popup
	_spawn_score_popup(pos, awarded)

	# Screen juice
	_screen_shake = 2.0

	# Spirit wisp pulse on kill
	_pulse_wisps_warm()

func _on_powerup_dropped(pos: Vector2) -> void:
	# Spawn a powerup at the position
	var pu_scene = preload("res://scenes/powerup.tscn")
	var pu = pu_scene.instantiate()
	pu.position = pos
	add_child(pu)

func _on_boss_defeated() -> void:
	# Extra screen shake + all wisps pulse bright
	_screen_shake = 5.0
	for w in _wisps:
		w["node"].color = Color(1.0, 0.9, 0.5, 0.8)

func _on_player_died() -> void:
	game_active = false
	spawner.stop()

	# Freeze frame
	Engine.time_scale = 0.05
	await get_tree().create_timer(0.06).timeout
	Engine.time_scale = 1.0

	_screen_shake = 4.0
	combo = 1
	combo_count = 0

	hud.show_game_over(score)
	web_bridge.send_game_over(score)

	# Wisps scatter in shock
	for w in _wisps:
		w["scatter"] = Vector2(randf_range(-60, 60), randf_range(-40, 40))
		w["node"].color = Color(1.0, 0.3, 0.2, 0.6)

func _restart() -> void:
	# Clean up all enemies and projectiles
	for child in get_children():
		if child is Area2D and child != po:
			child.queue_free()
	_start_game()

func _spawn_score_popup(pos: Vector2, value: int) -> void:
	var label = Label.new()
	label.text = "+%d" % value
	label.position = pos - Vector2(10, 10)
	label.add_theme_font_size_override("font_size", 10)
	label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.3, 1.0))
	label.z_index = 20
	add_child(label)
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(label, "position:y", label.position.y - 20, 0.5)
	tw.tween_property(label, "modulate:a", 0.0, 0.5)
	tw.chain().tween_callback(label.queue_free)

# ---- Screen Shake ----

func _update_screen_shake(delta: float) -> void:
	if _screen_shake > 0.0:
		_screen_shake = maxf(0.0, _screen_shake - _shake_decay * delta)
		camera.offset = Vector2(randf_range(-_screen_shake, _screen_shake), randf_range(-_screen_shake, _screen_shake))
	else:
		camera.offset = Vector2.ZERO

# ---- Ambient Star Field ----

func _create_stars() -> void:
	for i in range(STAR_COUNT):
		var star = ColorRect.new()
		star.size = Vector2(1, 1) if randf() > 0.3 else Vector2(2, 2)
		star.color = Color(1.0, 1.0, 1.0, randf_range(0.2, 0.7))
		star.position = Vector2(randf() * 640, randf() * 360)
		star.z_index = -10
		add_child(star)
		_stars.append({
			"node": star,
			"speed": randf_range(10, 40),
			"twinkle_phase": randf() * TAU,
			"twinkle_speed": randf_range(1.5, 4.0)
		})

func _update_stars(delta: float) -> void:
	for s in _stars:
		var node: ColorRect = s["node"]
		# Parallax scroll left
		node.position.x -= s["speed"] * delta
		if node.position.x < -5:
			node.position.x = 645
			node.position.y = randf() * 360

		# Twinkle
		s["twinkle_phase"] += s["twinkle_speed"] * delta
		node.modulate.a = 0.3 + sin(s["twinkle_phase"]) * 0.3

# ---- Ambient Spirit Wisps ----

func _create_wisps() -> void:
	for i in range(WISP_COUNT):
		var wisp = ColorRect.new()
		wisp.size = Vector2(3, 3)
		wisp.color = Color(0.3, 0.5, 0.8, 0.4)
		wisp.position = Vector2(randf() * 640, randf() * 360)
		wisp.z_index = -5
		add_child(wisp)
		_wisps.append({
			"node": wisp,
			"phase": randf() * TAU,
			"speed_x": randf_range(5, 15),
			"speed_y": randf_range(8, 20),
			"scatter": Vector2.ZERO,
			"base_color": Color(0.3, 0.5, 0.8, 0.4)
		})

func _update_wisps(delta: float) -> void:
	for w in _wisps:
		var node: ColorRect = w["node"]
		w["phase"] += delta * 1.5

		# Sine drift
		node.position.x -= w["speed_x"] * delta
		node.position.y += sin(w["phase"]) * w["speed_y"] * delta

		# Scatter recovery
		if w["scatter"].length() > 0.5:
			node.position += w["scatter"] * delta * 2.0
			w["scatter"] = w["scatter"].move_toward(Vector2.ZERO, 40 * delta)

		# Color recovery
		node.color = node.color.lerp(w["base_color"], delta * 2.0)

		# Wrap
		if node.position.x < -10:
			node.position.x = 650
			node.position.y = randf() * 360

		# Alpha pulse
		node.modulate.a = 0.3 + sin(w["phase"] * 2.0) * 0.2

func _pulse_wisps_warm() -> void:
	for w in _wisps:
		w["node"].color = Color(1.0, 0.8, 0.4, 0.6)

# ---- Input Map Setup ----

func _enter_tree() -> void:
	# Add input actions for this game
	if not InputMap.has_action("shoot"):
		InputMap.add_action("shoot")
		var ev = InputEventKey.new()
		ev.keycode = KEY_SPACE
		InputMap.action_add_event("shoot", ev)

	if not InputMap.has_action("move_left"):
		InputMap.add_action("move_left")
		var ev = InputEventKey.new()
		ev.keycode = KEY_LEFT
		InputMap.action_add_event("move_left", ev)
		var ev2 = InputEventKey.new()
		ev2.keycode = KEY_A
		InputMap.action_add_event("move_left", ev2)

	if not InputMap.has_action("move_right"):
		InputMap.add_action("move_right")
		var ev = InputEventKey.new()
		ev.keycode = KEY_RIGHT
		InputMap.action_add_event("move_right", ev)
		var ev2 = InputEventKey.new()
		ev2.keycode = KEY_D
		InputMap.action_add_event("move_right", ev2)

	if not InputMap.has_action("move_up"):
		InputMap.add_action("move_up")
		var ev = InputEventKey.new()
		ev.keycode = KEY_UP
		InputMap.action_add_event("move_up", ev)
		var ev2 = InputEventKey.new()
		ev2.keycode = KEY_W
		InputMap.action_add_event("move_up", ev2)

	if not InputMap.has_action("move_down"):
		InputMap.add_action("move_down")
		var ev = InputEventKey.new()
		ev.keycode = KEY_DOWN
		InputMap.action_add_event("move_down", ev)
		var ev2 = InputEventKey.new()
		ev2.keycode = KEY_S
		InputMap.action_add_event("move_down", ev2)
