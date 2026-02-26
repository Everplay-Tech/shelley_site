extends Node2D
## Contact Dash — catch falling envelopes, 30s timer or 5 misses.
## First zone transition game. Auto-starts, emits minigame_complete on end.

const GAME_DURATION := 30.0
const MAX_MISSES := 5
const MAGNET_CHANCE := 0.2
const MAGNET_DURATION := 3.0
const MAGNET_RADIUS := 80.0

# Difficulty ramp
const START_FALL_SPEED := 120.0
const END_FALL_SPEED := 250.0
const START_SPAWN_INTERVAL := 1.5
const END_SPAWN_INTERVAL := 0.6

# Brand colors
const WOOD := Color(0.29, 0.216, 0.157, 1.0)
const AMBER := Color(1.0, 0.749, 0.0, 1.0)
const CHARCOAL := Color(0.1, 0.1, 0.1, 1.0)
const BG_COLOR := Color(0.1, 0.1, 0.18, 1.0)  # Dark indigo

var _score := 0
var _misses := 0
var _elapsed := 0.0
var _spawn_timer := 0.0
var _game_over := false
var _magnet_timer := 0.0
var _game_started := false

# HUD references
var _miss_indicators: Array[ColorRect] = []
var _score_label: Label
var _timer_bar: ColorRect
var _timer_bar_bg: ColorRect

# Spirit wisps
var _wisps: Array[ColorRect] = []
const WISP_COUNT := 12

@onready var hpar: CharacterBody2D = $Hpar
@onready var envelope_container: Node2D = $EnvelopeContainer
@onready var wisp_container: Node2D = $WispContainer
@onready var hud: CanvasLayer = $HUD
@onready var web_bridge: Node = $WebBridge

func _ready() -> void:
	# Background
	$Background.color = BG_COLOR
	$Background.size = Vector2(640, 360)
	$Background.position = Vector2.ZERO

	# Build HUD
	_build_hud()

	# Spirit wisps
	_spawn_wisps()

	# Auto-start
	_game_started = true
	_spawn_timer = 0.5  # Brief delay before first envelope

	# Tell the website we're ready
	web_bridge.send_game_ready()

	# Connect Hpar's catch signal
	hpar.envelope_entered.connect(_on_hpar_envelope_entered)

func _process(delta: float) -> void:
	if _game_over or not _game_started:
		return

	_elapsed += delta
	var progress: float = clamp(_elapsed / GAME_DURATION, 0.0, 1.0)

	# Update timer bar
	_timer_bar.size.x = 600.0 * (1.0 - progress)

	# Magnet timer
	if _magnet_timer > 0:
		_magnet_timer -= delta
		if _magnet_timer <= 0:
			_disable_magnet()
		else:
			_pull_envelopes_to_hpar(delta)

	# Spawn envelopes
	_spawn_timer -= delta
	if _spawn_timer <= 0:
		var interval: float = lerp(START_SPAWN_INTERVAL, END_SPAWN_INTERVAL, progress)
		_spawn_timer = interval
		_spawn_envelope(progress)

	# Timer up
	if _elapsed >= GAME_DURATION:
		_end_game()
		return

	# Update wisps
	_update_wisps(delta)

	_update_touch_highlights()

func _update_touch_highlights() -> void:
	var left_btn := hud.get_node_or_null("TouchLeft")
	var right_btn := hud.get_node_or_null("TouchRight")
	if not left_btn: return
	var pressing := Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
	var mouse_x := 320.0
	if pressing:
		var vp := get_viewport()
		if vp: mouse_x = vp.get_mouse_position().x
	left_btn.color.a = 0.2 if pressing and mouse_x < 320.0 else 0.08
	right_btn.color.a = 0.2 if pressing and mouse_x >= 320.0 else 0.08

func _spawn_envelope(progress: float) -> void:
	var envelope = Area2D.new()
	envelope.set_script(preload("res://scripts/envelope.gd"))

	# Decide if magnet
	var is_mag: bool = randf() < MAGNET_CHANCE
	envelope.is_magnet = is_mag

	# Fall speed ramps with progress
	envelope.fall_speed = lerp(START_FALL_SPEED, END_FALL_SPEED, progress)

	# Random x position
	envelope.position = Vector2(randf_range(30, 610), -10)

	# Connect signals
	envelope.caught.connect(_on_envelope_caught)
	envelope.missed.connect(_on_envelope_missed)

	envelope_container.add_child(envelope)

func _on_hpar_envelope_entered(area: Area2D) -> void:
	if area.has_method("catch_it"):
		area.catch_it()

func _on_envelope_caught(envelope: Area2D) -> void:
	_score += 1
	_score_label.text = str(_score)

	# Score pop animation
	var tween = _score_label.create_tween()
	tween.tween_property(_score_label, "scale", Vector2(1.3, 1.3), 0.06)
	tween.tween_property(_score_label, "scale", Vector2(1.0, 1.0), 0.1)

	# Magnet activation
	if envelope.is_magnet:
		_activate_magnet()

	# Wisps pulse toward Hpar
	_wisps_react("catch")

	# Overbright catch flash at Hpar position
	var flash := ColorRect.new()
	flash.size = Vector2(20, 20)
	flash.position = Vector2(-10, -10)
	flash.color = Color(3.0, 2.5, 1.0, 0.6)
	flash.z_index = 10
	flash.global_position = hpar.global_position + Vector2(-10, -10)
	add_child(flash)
	var ft: Tween = flash.create_tween()
	ft.set_parallel(true)
	ft.tween_property(flash, "modulate:a", 0.0, 0.12)
	ft.tween_property(flash, "scale", Vector2(0.1, 0.1), 0.12)
	ft.chain().tween_callback(flash.queue_free)

func _on_envelope_missed(envelope: Area2D) -> void:
	_misses += 1

	# Update miss indicator
	if _misses <= MAX_MISSES and _misses > 0:
		var idx = _misses - 1
		if idx < _miss_indicators.size():
			_miss_indicators[idx].color = Color(0.9, 0.2, 0.2, 0.9)
			var tween = _miss_indicators[idx].create_tween()
			tween.tween_property(_miss_indicators[idx], "scale", Vector2(1.5, 1.5), 0.06)
			tween.tween_property(_miss_indicators[idx], "scale", Vector2(1.0, 1.0), 0.1)

	# Red edge flash
	_flash_edge_red()

	# Hit freeze on miss (MvC impact pause)
	Engine.time_scale = 0.1
	await get_tree().create_timer(0.04, true, false, true).timeout
	Engine.time_scale = 1.0
	# Screen shake
	_screen_shake(2.5)

	# Wisps scatter
	_wisps_react("miss")

	if _misses >= MAX_MISSES:
		_end_game()

func _activate_magnet() -> void:
	_magnet_timer = MAGNET_DURATION
	# Visual feedback — purple glow around Hpar
	var glow = ColorRect.new()
	glow.name = "MagnetGlow"
	glow.size = Vector2(MAGNET_RADIUS * 2, MAGNET_RADIUS * 2)
	glow.position = Vector2(-MAGNET_RADIUS, -MAGNET_RADIUS)
	glow.color = Color(0.5, 0.2, 0.8, 0.12)
	hpar.add_child(glow)

	# Spirit burst — ring of purple particles
	for i in range(6):
		var p := ColorRect.new()
		p.size = Vector2(3, 3)
		p.color = Color(0.6, 0.3, 0.9, 0.7)
		p.global_position = hpar.global_position
		p.z_index = 5
		add_child(p)
		var angle := float(i) / 6.0 * TAU
		var burst := Vector2(cos(angle), sin(angle)) * 40.0
		var pt: Tween = p.create_tween()
		pt.set_parallel(true)
		pt.tween_property(p, "global_position", p.global_position + burst, 0.25)
		pt.tween_property(p, "modulate:a", 0.0, 0.25)
		pt.tween_property(p, "scale", Vector2(0.3, 0.3), 0.25)
		pt.chain().tween_callback(p.queue_free)

func _disable_magnet() -> void:
	var glow = hpar.get_node_or_null("MagnetGlow")
	if glow:
		var tween = glow.create_tween()
		tween.tween_property(glow, "modulate:a", 0.0, 0.3)
		tween.tween_callback(glow.queue_free)

func _pull_envelopes_to_hpar(delta: float) -> void:
	for child in envelope_container.get_children():
		if child is Area2D and not child.get("_caught"):
			var dist = hpar.global_position.distance_to(child.global_position)
			if dist < MAGNET_RADIUS:
				# Pull toward Hpar
				var dir = (hpar.global_position - child.global_position).normalized()
				child.position += dir * 200.0 * delta

func _flash_edge_red() -> void:
	var flash = ColorRect.new()
	flash.size = Vector2(640, 360)
	flash.color = Color(0.8, 0.1, 0.1, 0.15)
	flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(flash)
	var tween = flash.create_tween()
	tween.tween_property(flash, "modulate:a", 0.0, 0.25)
	tween.tween_callback(flash.queue_free)

func _end_game() -> void:
	_game_over = true

	# Show final score overlay
	var panel = ColorRect.new()
	panel.size = Vector2(200, 100)
	panel.position = Vector2(220, 120)
	panel.color = Color(0.1, 0.1, 0.15, 0.9)
	hud.add_child(panel)

	var title = Label.new()
	title.text = "DELIVERED!"
	title.add_theme_font_size_override("font_size", 16)
	title.add_theme_color_override("font_color", AMBER)
	title.position = Vector2(50, 15)
	panel.add_child(title)

	var score_text = Label.new()
	score_text.text = "%d envelopes" % _score
	score_text.add_theme_font_size_override("font_size", 12)
	score_text.add_theme_color_override("font_color", Color.WHITE)
	score_text.position = Vector2(50, 45)
	panel.add_child(score_text)

	# Fade in
	panel.modulate.a = 0.0
	var tween = panel.create_tween()
	tween.tween_property(panel, "modulate:a", 1.0, 0.4)

	# Send minigame_complete after delay
	await get_tree().create_timer(2.0).timeout
	web_bridge.send_minigame_complete(_score, false)

# ---- HUD ----

func _build_hud() -> void:
	# Miss indicators (top-left)
	var miss_container = HBoxContainer.new()
	miss_container.position = Vector2(16, 12)
	miss_container.add_theme_constant_override("separation", 4)
	hud.add_child(miss_container)

	for i in range(MAX_MISSES):
		var ind = ColorRect.new()
		ind.custom_minimum_size = Vector2(8, 6)
		ind.size = Vector2(8, 6)
		ind.color = Color(0.3, 0.3, 0.35, 0.5)  # Dim envelope shape
		ind.pivot_offset = Vector2(4, 3)
		miss_container.add_child(ind)
		_miss_indicators.append(ind)

	# Score label (top-right)
	_score_label = Label.new()
	_score_label.text = "0"
	_score_label.add_theme_font_size_override("font_size", 14)
	_score_label.add_theme_color_override("font_color", AMBER)
	_score_label.position = Vector2(590, 10)
	_score_label.pivot_offset = Vector2(16, 8)
	_score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hud.add_child(_score_label)

	# Timer bar background (bottom)
	_timer_bar_bg = ColorRect.new()
	_timer_bar_bg.size = Vector2(600, 4)
	_timer_bar_bg.position = Vector2(20, 348)
	_timer_bar_bg.color = Color(0.15, 0.15, 0.2, 0.6)
	hud.add_child(_timer_bar_bg)

	# Timer bar (depleting)
	_timer_bar = ColorRect.new()
	_timer_bar.size = Vector2(600, 4)
	_timer_bar.position = Vector2(20, 348)
	_timer_bar.color = WOOD
	hud.add_child(_timer_bar)

	_build_touch_ui()

func _build_touch_ui() -> void:
	# Left arrow — bottom-left
	var left_btn := ColorRect.new()
	left_btn.name = "TouchLeft"
	left_btn.size = Vector2(64, 48)
	left_btn.position = Vector2(16, 280)
	left_btn.color = Color(1.0, 1.0, 1.0, 0.08)
	left_btn.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(left_btn)
	# Left chevron (two angled bars forming <)
	var lc1 := ColorRect.new(); lc1.size = Vector2(3, 14); lc1.position = Vector2(24, 12); lc1.color = Color(1,1,1,0.25); lc1.rotation = 0.5; left_btn.add_child(lc1)
	var lc2 := ColorRect.new(); lc2.size = Vector2(3, 14); lc2.position = Vector2(24, 28); lc2.color = Color(1,1,1,0.25); lc2.rotation = -0.5; left_btn.add_child(lc2)

	# Right arrow — bottom-right
	var right_btn := ColorRect.new()
	right_btn.name = "TouchRight"
	right_btn.size = Vector2(64, 48)
	right_btn.position = Vector2(560, 280)
	right_btn.color = Color(1.0, 1.0, 1.0, 0.08)
	right_btn.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(right_btn)
	# Right chevron
	var rc1 := ColorRect.new(); rc1.size = Vector2(3, 14); rc1.position = Vector2(36, 12); rc1.color = Color(1,1,1,0.25); rc1.rotation = -0.5; right_btn.add_child(rc1)
	var rc2 := ColorRect.new(); rc2.size = Vector2(3, 14); rc2.position = Vector2(36, 28); rc2.color = Color(1,1,1,0.25); rc2.rotation = 0.5; right_btn.add_child(rc2)

func _screen_shake(magnitude: float) -> void:
	var tween: Tween = create_tween()
	for i in range(5):
		var intensity: float = magnitude * (1.0 - float(i) / 5.0)
		var offset := Vector2(randf_range(-intensity, intensity), randf_range(-intensity * 0.5, intensity * 0.5))
		tween.tween_property(self, "position", offset, 0.03)
	tween.tween_property(self, "position", Vector2.ZERO, 0.05)

# ---- Spirit Wisps ----

func _spawn_wisps() -> void:
	for i in range(WISP_COUNT):
		var wisp = ColorRect.new()
		var size: float = randf_range(1.5, 3.0)
		wisp.size = Vector2(size, size)
		wisp.color = Color(0.4, 0.6, 0.9, randf_range(0.15, 0.3))
		wisp.position = Vector2(randf_range(10, 630), randf_range(10, 340))
		wisp.set_meta("base_x", wisp.position.x)
		wisp.set_meta("base_y", wisp.position.y)
		wisp.set_meta("phase", randf() * TAU)
		wisp.set_meta("speed", randf_range(0.3, 0.8))
		wisp.set_meta("amplitude", randf_range(8, 20))
		wisp_container.add_child(wisp)
		_wisps.append(wisp)

func _update_wisps(delta: float) -> void:
	var time = _elapsed
	for wisp in _wisps:
		if not is_instance_valid(wisp):
			continue
		var phase: float = wisp.get_meta("phase")
		var spd: float = wisp.get_meta("speed")
		var amp: float = wisp.get_meta("amplitude")
		var bx: float = wisp.get_meta("base_x")
		var by: float = wisp.get_meta("base_y")

		wisp.position.x = bx + sin(time * spd + phase) * amp
		wisp.position.y = by + cos(time * spd * 0.7 + phase * 1.3) * amp * 0.6

		# Gentle alpha pulsing
		wisp.color.a = 0.15 + sin(time * spd * 2.0 + phase) * 0.1

func _wisps_react(reaction: String) -> void:
	for wisp in _wisps:
		if not is_instance_valid(wisp):
			continue
		if reaction == "catch":
			# Pulse amber briefly
			var original_color = wisp.color
			wisp.color = Color(1.0, 0.75, 0.0, 0.4)
			var tween = wisp.create_tween()
			tween.tween_property(wisp, "color", original_color, 0.4)
		elif reaction == "miss":
			# Flash red and scatter
			var original_color = wisp.color
			wisp.color = Color(0.9, 0.2, 0.2, 0.5)
			var scatter = Vector2(randf_range(-15, 15), randf_range(-15, 15))
			var tween = wisp.create_tween()
			tween.set_parallel(true)
			tween.tween_property(wisp, "position", wisp.position + scatter, 0.15)
			tween.tween_property(wisp, "color", original_color, 0.4)
