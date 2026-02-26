extends Node2D
## Gallery Run — Space Invaders zone transition game for /gallery route.
## Axis Mundi (living ship) defends against waves of gallery enemies.

# ─── Constants ────────────────────────────────────────────────────────────────
const GAME_DURATION := 30.0
const WAVE_ROWS := 4
const WAVE_COLS := 6
const FORMATION_SPACING := Vector2(40.0, 32.0)
const FORMATION_START_Y := 40.0
const FORMATION_STEP_DOWN := 16.0
const START_FORMATION_SPEED := 40.0
const END_FORMATION_SPEED := 80.0
const PLAYER_MAX_HP := 3
const POWERUP_DROP_CHANCE := 0.2

# Colors
const AMBER := Color(1.0, 0.75, 0.0)
const WOOD := Color(0.29, 0.216, 0.157)
const CHARCOAL := Color(0.1, 0.1, 0.1)
const BG_COLOR := Color(0.07, 0.063, 0.118)  # Deep gallery purple

# ─── Node refs ────────────────────────────────────────────────────────────────
@onready var ship: Area2D = $Ship
@onready var bullet_container: Node2D = $BulletContainer
@onready var enemy_container: Node2D = $EnemyContainer
@onready var enemy_bullet_container: Node2D = $EnemyBulletContainer
@onready var wisp_container: Node2D = $WispContainer
@onready var hud: CanvasLayer = $HUD
@onready var web_bridge: Node = $WebBridge

# ─── State ────────────────────────────────────────────────────────────────────
var _elapsed := 0.0
var _score := 0
var _player_hp := PLAYER_MAX_HP
var _game_over := false
var _game_started := false

# Wave / formation
var _wave_number := 0
var _formation: Array = []  # 2D array of enemies (or null for destroyed)
var _formation_origin := Vector2.ZERO
var _formation_dir := 1.0
var _formation_speed := START_FORMATION_SPEED
var _wave_pause := false
var _wave_pause_timer := 0.0
var _enemies_alive := 0

# HUD refs
var _hearts: Array[ColorRect] = []
var _score_label: Label
var _wave_label: Label
var _timer_bar: ColorRect
var _timer_bar_bg: ColorRect
var _game_over_panel: ColorRect

# Spirit wisps
const WISP_COUNT := 12
var _wisps: Array[ColorRect] = []

# Preloaded scripts
var BulletScript = preload("res://scripts/bullet.gd")
var EnemyBulletScript = preload("res://scripts/enemy_bullet.gd")
var EnemyScript = preload("res://scripts/enemy.gd")

# ─── Lifecycle ────────────────────────────────────────────────────────────────

func _ready() -> void:
	_build_hud()
	_spawn_wisps()
	ship.fire_requested.connect(_on_ship_fire)
	ship.hit_taken.connect(_on_ship_hit)
	# Auto-start
	_game_started = true
	_spawn_wave()
	web_bridge.send_game_ready()

func _process(delta: float) -> void:
	if _game_over:
		return
	if not _game_started:
		return
	_elapsed += delta
	var progress: float = clampf(_elapsed / GAME_DURATION, 0.0, 1.0)
	# Update formation speed based on progress
	_formation_speed = lerpf(START_FORMATION_SPEED, END_FORMATION_SPEED, progress)
	# Update timer bar
	_timer_bar.size.x = 600.0 * (1.0 - progress)
	# Wave pause
	if _wave_pause:
		_wave_pause_timer += delta
		if _wave_pause_timer >= 1.0:
			_wave_pause = false
			_wave_pause_timer = 0.0
			_spawn_wave()
		return
	# Move formation
	_update_formation(delta)
	# Check end conditions
	if _elapsed >= GAME_DURATION:
		_end_game("GALLERY OPENED!")
	elif _player_hp <= 0:
		_end_game("SHIP DOWN!")
	# Update wisps
	_update_wisps(delta)
	_update_touch_highlights()

# ─── Formation System ─────────────────────────────────────────────────────────

func _spawn_wave() -> void:
	_wave_number += 1
	_update_wave_label()
	_formation.clear()
	_enemies_alive = 0
	# Center formation horizontally
	var total_width: float = (WAVE_COLS - 1) * FORMATION_SPACING.x
	_formation_origin = Vector2((640.0 - total_width) / 2.0, FORMATION_START_Y)
	_formation_dir = 1.0
	for row in range(WAVE_ROWS):
		var row_arr: Array = []
		for col in range(WAVE_COLS):
			var type: int = _get_enemy_type_for_wave(row)
			var enemy: Area2D = Area2D.new()
			enemy.set_script(EnemyScript)
			enemy.setup(type, Vector2i(col, row))
			# Front row can attack
			if row == WAVE_ROWS - 1:
				enemy.can_attack = true
			enemy.defeated.connect(_on_enemy_defeated)
			enemy.attack_fired.connect(_on_enemy_attack)
			# Position in formation
			var pos := _formation_origin + Vector2(col * FORMATION_SPACING.x, row * FORMATION_SPACING.y)
			enemy.position = pos
			enemy.add_to_group("enemies")
			enemy_container.add_child(enemy)
			row_arr.append(enemy)
			_enemies_alive += 1
		_formation.append(row_arr)

func _get_enemy_type_for_wave(row: int) -> int:
	# Wave 1: Frames only
	# Wave 2: Back rows = Wraith, front rows = Frame
	# Wave 3+: Mix all three types
	if _wave_number == 1:
		return 0  # FRAME
	elif _wave_number == 2:
		if row < 2:
			return 1  # WRAITH
		else:
			return 0  # FRAME
	else:
		if row == 0:
			return 2  # CRITIC
		elif row < 2:
			return 1  # WRAITH
		else:
			if randf() < 0.3:
				return 1  # WRAITH
			else:
				return 0  # FRAME

func _update_formation(delta: float) -> void:
	# Move formation horizontally
	_formation_origin.x += _formation_dir * _formation_speed * delta
	# Check if any enemy hits the viewport edge
	var should_step_down := false
	for row in _formation:
		for enemy in row:
			if enemy != null and is_instance_valid(enemy):
				var world_x: float = enemy.grid_pos.x * FORMATION_SPACING.x + _formation_origin.x
				world_x += enemy.get_zigzag_offset()
				if world_x < 20.0 or world_x > 620.0:
					should_step_down = true
					break
		if should_step_down:
			break
	if should_step_down:
		_formation_dir *= -1.0
		_formation_origin.y += FORMATION_STEP_DOWN
	# Update enemy positions
	for row in _formation:
		for enemy in row:
			if enemy != null and is_instance_valid(enemy):
				var target := _formation_origin + Vector2(
					enemy.grid_pos.x * FORMATION_SPACING.x,
					enemy.grid_pos.y * FORMATION_SPACING.y
				)
				target.x += enemy.get_zigzag_offset()
				enemy.position = target
	# Check if formation reached player level
	var lowest_y := _formation_origin.y + (WAVE_ROWS - 1) * FORMATION_SPACING.y
	if lowest_y > 300.0:
		# Enemies reached the bottom — damage player
		_on_ship_hit()

# ─── Combat ───────────────────────────────────────────────────────────────────

func _on_ship_fire() -> void:
	if _game_over or _wave_pause:
		return
	if ship.triple_shot:
		# Fan spread: -10°, 0°, +10°
		for angle_deg in [-10.0, 0.0, 10.0]:
			_spawn_bullet(angle_deg)
	else:
		_spawn_bullet(0.0)

func _spawn_bullet(angle_deg: float) -> void:
	var bullet := Area2D.new()
	bullet.set_script(BulletScript)
	bullet.position = ship.position + Vector2(0, -24)  # From wolf heads
	bullet.rotation = deg_to_rad(angle_deg)
	bullet.add_to_group("player_bullets")
	bullet_container.add_child(bullet)
	# Muzzle flash
	var flash := ColorRect.new()
	flash.size = Vector2(8, 8)
	flash.position = ship.position + Vector2(-4, -28)
	flash.color = Color(2.0, 1.8, 1.0, 0.9)
	flash.z_index = 10
	add_child(flash)
	var flash_tw: Tween = flash.create_tween()
	flash_tw.set_parallel(true)
	flash_tw.tween_property(flash, "modulate:a", 0.0, 0.08)
	flash_tw.tween_property(flash, "scale", Vector2(0.2, 0.2), 0.08)
	flash_tw.chain().tween_callback(flash.queue_free)

func _on_enemy_attack(enemy: Area2D) -> void:
	if _game_over:
		return
	var bullet := Area2D.new()
	bullet.set_script(EnemyBulletScript)
	bullet.position = enemy.position + Vector2(0, 12)
	# Color by type
	if enemy.enemy_type == 1:  # WRAITH
		bullet.bullet_color = Color(0.3, 0.8, 0.2, 0.9)  # Green paint
	else:  # CRITIC
		bullet.bullet_color = Color(0.8, 0.2, 0.2, 0.9)  # Red quill
	bullet.add_to_group("enemy_bullets")
	enemy_bullet_container.add_child(bullet)

func _on_enemy_defeated(enemy: Area2D) -> void:
	var wave_mult: int = mini(_wave_number, 3)
	var pts: int = enemy.points * wave_mult
	_score += pts
	_score_label.text = str(_score)
	# Score pop
	_score_label.scale = Vector2(1.3, 1.3)
	var tween: Tween = _score_label.create_tween()
	tween.tween_property(_score_label, "scale", Vector2.ONE, 0.15)
	# Floating score popup
	_spawn_score_popup(enemy.global_position, pts)
	# Power-up drop
	if randf() < POWERUP_DROP_CHANCE:
		_spawn_powerup_drop(enemy.global_position)
	# Wisps react
	_wisps_react("kill")
	# Hit freeze on enemy death (MvC impact)
	if enemy.enemy_type >= 1:  # Wraiths and Critics get freeze
		Engine.time_scale = 0.1
		await get_tree().create_timer(0.03, true, false, true).timeout
		Engine.time_scale = 1.0
	_screen_shake(1.5 + enemy.enemy_type * 0.5)
	# Track alive count
	_enemies_alive -= 1
	# Null out in formation
	for row in _formation:
		for i in range(row.size()):
			if row[i] == enemy:
				row[i] = null
				# Update front row attack status
				_update_front_row_attackers()
				break
	# Check wave clear
	if _enemies_alive <= 0:
		# Wave clear flash
		var wave_flash := ColorRect.new()
		wave_flash.size = Vector2(640, 360)
		wave_flash.color = Color(1.0, 0.85, 0.3, 0.15)
		wave_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
		add_child(wave_flash)
		var wf_tw: Tween = wave_flash.create_tween()
		wf_tw.tween_property(wave_flash, "modulate:a", 0.0, 0.4)
		wf_tw.tween_callback(wave_flash.queue_free)
		_wave_pause = true
		_wave_pause_timer = 0.0

func _update_front_row_attackers() -> void:
	# For each column, find the lowest surviving enemy and enable attack
	for col in range(WAVE_COLS):
		var found := false
		for row_idx in range(WAVE_ROWS - 1, -1, -1):
			if row_idx < _formation.size() and col < _formation[row_idx].size():
				var enemy = _formation[row_idx][col]
				if enemy != null and is_instance_valid(enemy):
					enemy.can_attack = not found
					if not found:
						found = true
					else:
						enemy.can_attack = false

func _on_ship_hit() -> void:
	if _game_over:
		return
	_player_hp -= 1
	_update_hearts()
	_wisps_react("damage")
	# Screen shake
	_screen_shake(3.0)
	# Hit freeze on damage
	Engine.time_scale = 0.08
	await get_tree().create_timer(0.04, true, false, true).timeout
	Engine.time_scale = 1.0
	# Red burst particles
	for i in range(8):
		var p := ColorRect.new()
		p.size = Vector2(randf_range(2, 4), randf_range(2, 4))
		p.color = Color(1.0, 0.3, 0.2, 0.8)
		p.global_position = ship.global_position + Vector2(randf_range(-10, 10), randf_range(-10, 10))
		p.z_index = 10
		add_child(p)
		var dir := Vector2(randf_range(-60, 60), randf_range(-60, 60))
		var pt: Tween = p.create_tween()
		pt.set_parallel(true)
		pt.tween_property(p, "global_position", p.global_position + dir * 0.3, 0.3)
		pt.tween_property(p, "modulate:a", 0.0, 0.3)
		pt.chain().tween_callback(p.queue_free)
	if _player_hp <= 0:
		_end_game("SHIP DOWN!")

# ─── HUD ──────────────────────────────────────────────────────────────────────

func _build_hud() -> void:
	# Hearts (top-left)
	for i in range(PLAYER_MAX_HP):
		var heart := ColorRect.new()
		heart.custom_minimum_size = Vector2(10, 10)
		heart.size = Vector2(10, 10)
		heart.position = Vector2(16 + i * 16, 12)
		heart.color = AMBER
		heart.pivot_offset = Vector2(5, 5)
		hud.add_child(heart)
		_hearts.append(heart)
	# Score label (top-right)
	_score_label = Label.new()
	_score_label.text = "0"
	_score_label.add_theme_font_size_override("font_size", 14)
	_score_label.add_theme_color_override("font_color", AMBER)
	_score_label.position = Vector2(570, 10)
	_score_label.pivot_offset = Vector2(16, 8)
	_score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_score_label.custom_minimum_size = Vector2(60, 0)
	hud.add_child(_score_label)
	# Wave label (top-center)
	_wave_label = Label.new()
	_wave_label.text = ""
	_wave_label.add_theme_font_size_override("font_size", 10)
	_wave_label.add_theme_color_override("font_color", Color(1, 1, 1, 0.4))
	_wave_label.position = Vector2(280, 12)
	_wave_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_wave_label.custom_minimum_size = Vector2(80, 0)
	hud.add_child(_wave_label)
	# Timer bar (bottom)
	_timer_bar_bg = ColorRect.new()
	_timer_bar_bg.size = Vector2(600, 4)
	_timer_bar_bg.position = Vector2(20, 348)
	_timer_bar_bg.color = Color(0.15, 0.15, 0.2, 0.6)
	hud.add_child(_timer_bar_bg)
	_timer_bar = ColorRect.new()
	_timer_bar.size = Vector2(600, 4)
	_timer_bar.position = Vector2(20, 348)
	_timer_bar.color = WOOD
	hud.add_child(_timer_bar)
	_build_touch_ui()

func _update_hearts() -> void:
	for i in range(_hearts.size()):
		if i < _player_hp:
			_hearts[i].color = AMBER
		else:
			_hearts[i].color = Color(0.3, 0.15, 0.15, 0.4)
			# Pop animation on loss
			_hearts[i].scale = Vector2(1.4, 1.4)
			var tween: Tween = _hearts[i].create_tween()
			tween.tween_property(_hearts[i], "scale", Vector2.ONE, 0.2)

func _update_wave_label() -> void:
	_wave_label.text = "WAVE %d" % _wave_number
	_wave_label.modulate = Color(1, 1, 1, 1)
	var tween: Tween = _wave_label.create_tween()
	tween.tween_property(_wave_label, "modulate:a", 0.4, 1.0)

func _build_touch_ui() -> void:
	# Left arrow — bottom-left
	var left_btn := ColorRect.new()
	left_btn.name = "TouchLeft"
	left_btn.size = Vector2(56, 48)
	left_btn.position = Vector2(16, 280)
	left_btn.color = Color(1.0, 1.0, 1.0, 0.08)
	left_btn.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(left_btn)
	# Left chevron
	var lc1 := ColorRect.new(); lc1.size = Vector2(3, 16); lc1.position = Vector2(18, 16); lc1.color = Color(1,1,1,0.25); lc1.rotation = 0.5; left_btn.add_child(lc1)
	var lc2 := ColorRect.new(); lc2.size = Vector2(3, 16); lc2.position = Vector2(18, 32); lc2.color = Color(1,1,1,0.25); lc2.rotation = -0.5; left_btn.add_child(lc2)

	# Right arrow — bottom-right
	var right_btn := ColorRect.new()
	right_btn.name = "TouchRight"
	right_btn.size = Vector2(56, 48)
	right_btn.position = Vector2(568, 280)
	right_btn.color = Color(1.0, 1.0, 1.0, 0.08)
	right_btn.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(right_btn)
	# Right chevron
	var rc1 := ColorRect.new(); rc1.size = Vector2(3, 16); rc1.position = Vector2(34, 16); rc1.color = Color(1,1,1,0.25); rc1.rotation = -0.5; right_btn.add_child(rc1)
	var rc2 := ColorRect.new(); rc2.size = Vector2(3, 16); rc2.position = Vector2(34, 32); rc2.color = Color(1,1,1,0.25); rc2.rotation = 0.5; right_btn.add_child(rc2)

	# Fire button — bottom-center
	var fire_btn := ColorRect.new()
	fire_btn.name = "TouchFire"
	fire_btn.size = Vector2(96, 48)
	fire_btn.position = Vector2(272, 280)
	fire_btn.color = Color(1.0, 0.75, 0.0, 0.06)
	fire_btn.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(fire_btn)
	var fire_lbl := Label.new()
	fire_lbl.text = "FIRE"
	fire_lbl.add_theme_font_size_override("font_size", 10)
	fire_lbl.add_theme_color_override("font_color", Color(1.0, 0.75, 0.0, 0.2))
	fire_lbl.position = Vector2(30, 16)
	fire_btn.add_child(fire_lbl)

func _update_touch_highlights() -> void:
	var left_btn := hud.get_node_or_null("TouchLeft")
	var right_btn := hud.get_node_or_null("TouchRight")
	var fire_btn := hud.get_node_or_null("TouchFire")
	if not left_btn: return
	var pressing := Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
	var mouse_x := 320.0
	if pressing:
		var vp := get_viewport()
		if vp: mouse_x = vp.get_mouse_position().x
	left_btn.color.a = 0.2 if pressing and mouse_x < 160.0 else 0.08
	right_btn.color.a = 0.2 if pressing and mouse_x > 480.0 else 0.08
	fire_btn.color.a = 0.15 if pressing and mouse_x >= 160.0 and mouse_x <= 480.0 else 0.06

# ─── Game Over ────────────────────────────────────────────────────────────────

func _end_game(message: String) -> void:
	_game_over = true
	# Clear projectiles
	for child in bullet_container.get_children():
		child.queue_free()
	for child in enemy_bullet_container.get_children():
		child.queue_free()
	# Show overlay
	_game_over_panel = ColorRect.new()
	_game_over_panel.size = Vector2(640, 360)
	_game_over_panel.color = Color(0, 0, 0, 0)
	hud.add_child(_game_over_panel)
	var tween: Tween = _game_over_panel.create_tween()
	tween.tween_property(_game_over_panel, "color:a", 0.7, 0.5)
	# Title
	var title := Label.new()
	title.text = message
	title.add_theme_font_size_override("font_size", 20)
	title.add_theme_color_override("font_color", AMBER)
	title.position = Vector2(200, 140)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.custom_minimum_size = Vector2(240, 0)
	_game_over_panel.add_child(title)
	# Score
	var score_text := Label.new()
	score_text.text = "Score: %d" % _score
	score_text.add_theme_font_size_override("font_size", 12)
	score_text.add_theme_color_override("font_color", Color(1, 1, 1, 0.7))
	score_text.position = Vector2(250, 175)
	score_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	score_text.custom_minimum_size = Vector2(140, 0)
	_game_over_panel.add_child(score_text)
	# Wait then send minigame_complete
	await get_tree().create_timer(2.0).timeout
	web_bridge.send_minigame_complete(_score, false)

# ─── VFX ──────────────────────────────────────────────────────────────────────

func _spawn_score_popup(pos: Vector2, pts: int) -> void:
	var popup := Label.new()
	popup.text = "+%d" % pts
	popup.add_theme_font_size_override("font_size", 8)
	popup.add_theme_color_override("font_color", AMBER)
	popup.position = pos + Vector2(-10, -8)
	popup.z_index = 10
	add_child(popup)
	var tween: Tween = popup.create_tween()
	tween.set_parallel(true)
	tween.tween_property(popup, "position:y", pos.y - 30, 0.6)
	tween.tween_property(popup, "modulate:a", 0.0, 0.6)
	tween.chain().tween_callback(popup.queue_free)

func _spawn_powerup_drop(from_pos: Vector2) -> void:
	# Animated power-up icon that falls from enemy to ship, then activates
	var icon: Node2D
	var tex_path := "res://sprites/enemies/powerup.png"
	if ResourceLoader.exists(tex_path):
		var spr := Sprite2D.new()
		spr.texture = load(tex_path)
		spr.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		icon = spr
	else:
		# Fallback: golden diamond
		var fallback := ColorRect.new()
		fallback.size = Vector2(10, 10)
		fallback.position = Vector2(-5, -5)
		fallback.color = Color(0.3, 1.0, 0.5, 0.9)
		fallback.rotation = PI / 4.0
		icon = Node2D.new()
		icon.add_child(fallback)
	icon.position = from_pos
	icon.z_index = 12
	add_child(icon)
	# Tween: fall toward ship, then activate on arrival
	var target_pos := ship.global_position + Vector2(0, -10)
	var drop_tw: Tween = icon.create_tween()
	drop_tw.set_parallel(true)
	drop_tw.tween_property(icon, "position", target_pos, 0.5).set_ease(Tween.EASE_IN)
	drop_tw.tween_property(icon, "scale", Vector2(1.3, 1.3), 0.25).set_ease(Tween.EASE_OUT)
	drop_tw.chain().tween_property(icon, "scale", Vector2.ONE, 0.25).set_ease(Tween.EASE_IN)
	drop_tw.chain().tween_callback(func():
		ship.activate_triple_shot()
		_spawn_powerup_text(icon.global_position)
		# Collection burst
		icon.modulate = Color(1.0, 1.0, 1.0, 2.0)
		var burst_tw: Tween = icon.create_tween()
		burst_tw.set_parallel(true)
		burst_tw.tween_property(icon, "modulate:a", 0.0, 0.2)
		burst_tw.tween_property(icon, "scale", Vector2(2.0, 2.0), 0.2)
		burst_tw.chain().tween_callback(icon.queue_free)
	)

func _spawn_powerup_text(pos: Vector2) -> void:
	var popup := Label.new()
	popup.text = "TRIPLE SHOT!"
	popup.add_theme_font_size_override("font_size", 8)
	popup.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	popup.position = pos + Vector2(-25, 5)
	popup.z_index = 10
	add_child(popup)
	var tween: Tween = popup.create_tween()
	tween.set_parallel(true)
	tween.tween_property(popup, "position:y", pos.y - 20, 0.8)
	tween.tween_property(popup, "modulate:a", 0.0, 0.8)
	tween.chain().tween_callback(popup.queue_free)

func _screen_shake(magnitude: float) -> void:
	var orig := Vector2.ZERO
	var tween: Tween = create_tween()
	for i in range(6):
		var intensity: float = magnitude * (1.0 - float(i) / 6.0)
		var offset := Vector2(randf_range(-intensity, intensity), randf_range(-intensity * 0.5, intensity * 0.5))
		tween.tween_property(self, "position", offset, 0.03)
	tween.tween_property(self, "position", Vector2.ZERO, 0.05)

# ─── Spirit Wisps ─────────────────────────────────────────────────────────────

func _spawn_wisps() -> void:
	for i in range(WISP_COUNT):
		var wisp := ColorRect.new()
		var s: float = randf_range(1.5, 3.0)
		wisp.size = Vector2(s, s)
		wisp.color = Color(0.4, 0.3, 0.7, randf_range(0.12, 0.25))  # Purple-ish gallery
		wisp.position = Vector2(randf_range(10, 630), randf_range(10, 340))
		wisp.set_meta("base_x", wisp.position.x)
		wisp.set_meta("base_y", wisp.position.y)
		wisp.set_meta("phase", randf() * TAU)
		wisp.set_meta("speed", randf_range(0.3, 0.8))
		wisp.set_meta("amplitude", randf_range(8, 20))
		wisp_container.add_child(wisp)
		_wisps.append(wisp)

func _update_wisps(delta: float) -> void:
	var time: float = _elapsed
	for wisp in _wisps:
		if not is_instance_valid(wisp):
			continue
		var bx: float = wisp.get_meta("base_x")
		var by: float = wisp.get_meta("base_y")
		var phase: float = wisp.get_meta("phase")
		var spd: float = wisp.get_meta("speed")
		var amp: float = wisp.get_meta("amplitude")
		wisp.position.x = bx + sin(time * spd + phase) * amp
		wisp.position.y = by + cos(time * spd * 0.7 + phase * 1.3) * amp * 0.6
		wisp.color.a = 0.12 + sin(time * spd * 2.0 + phase) * 0.08

func _wisps_react(reaction: String) -> void:
	for wisp in _wisps:
		if not is_instance_valid(wisp):
			continue
		var original_color := Color(0.4, 0.3, 0.7, wisp.color.a)
		if reaction == "kill":
			wisp.color = Color(1.0, 0.75, 0.0, 0.35)
			var tween: Tween = wisp.create_tween()
			tween.tween_property(wisp, "color", original_color, 0.4)
		elif reaction == "damage":
			wisp.color = Color(0.9, 0.2, 0.2, 0.4)
			var scatter := Vector2(randf_range(-15, 15), randf_range(-15, 15))
			var tween: Tween = wisp.create_tween()
			tween.set_parallel(true)
			tween.tween_property(wisp, "position", wisp.position + scatter, 0.15)
			tween.tween_property(wisp, "color", original_color, 0.5)
