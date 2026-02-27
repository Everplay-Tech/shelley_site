extends CharacterBody2D
## Po character controller — Sega Genesis feel (Shinobi 3 / Contra Hard Corps).
## Auto-runs, player controls jump, slide, and fast-fall.
## Tuned for snappy, responsive inputs with Sly Cooper juice layer.
## NG+ adds Spirit Fist (ranged) and Ghost Whip (melee) attacks via smoke arm VFX.

signal stumbled
signal pick_collected(value: int, food_name: String)
signal health_changed(current: int, max_val: int)
signal died
signal attack_fired(attack_type: String, position: Vector2)  # For main.gd to spawn projectile

# --- Physics Tuning (Sega Genesis feel) ---
const GRAVITY := 1200.0           # Higher gravity = snappier falls
const APEX_GRAVITY_MULT := 0.5    # Less gravity at jump apex for hang time
const FAST_FALL_GRAVITY := 2200.0 # Fast-fall when pressing down in air
const JUMP_FORCE := -430.0        # Initial jump velocity
const JUMP_CUT_MULT := 1.8        # Gravity multiplier when jump released early
const DOUBLE_JUMP_FORCE := -380.0 # Slightly weaker air jump
const COYOTE_TIME := 0.08         # Time after leaving ground you can still jump
const JUMP_BUFFER_TIME := 0.12    # Input buffer for jump
const SLIDE_DURATION := 0.35      # Fixed slide duration — quick and punchy
const STUMBLE_DURATION := 0.4     # Quick recovery
const RUN_SPEED := 0.0            # World scrolls, Po stays in place

# --- Juice Tuning (Sly Cooper layer) ---
const GHOST_INTERVAL := 0.04          # Ghost spawn rate (seconds)
const GHOST_FADE_TIME := 0.25         # How long afterimages linger
const GHOST_JUMP_COLOR := Color(0.4, 0.7, 1.0, 0.55)   # Spectral blue
const GHOST_SLIDE_COLOR := Color(0.3, 0.9, 0.4, 0.5)    # Hoodie green
const GHOST_DOUBLE_JUMP_COLOR := Color(0.8, 0.5, 1.0, 0.7)  # Spirit purple
const DUST_COLOR := Color(0.65, 0.55, 0.4, 0.7)         # Earthy dust
const HIT_FREEZE_TIME := 0.04        # Near-pause duration on stumble
const PICK_FLASH_COLOR := Color(3.0, 2.5, 1.0, 1.0)     # Overbright amber
const SPEED_LINE_INTERVAL := 0.025     # Rapid streaks during slide
const SPEED_LINE_LENGTH_MIN := 14.0
const SPEED_LINE_LENGTH_MAX := 38.0
const RUN_DUST_INTERVAL := 0.18        # Subtle footfall particles
const GHOST_DEFEAT_COLOR := Color(1.0, 0.8, 0.2, 0.7)  # Golden amber for enemy defeat

@export var can_double_jump := true

# --- Health ---
const DEFAULT_HEALTH := 5
const NG_PLUS_HEALTH := 7
const INVINCIBILITY_DURATION := 1.5
const HEAL_FLASH_COLOR := Color(0.4, 1.5, 0.6, 1.0)  # Overbright green

var max_health := DEFAULT_HEALTH
var health := DEFAULT_HEALTH
var is_dead := false
var _invincible := false
var _invincible_timer := 0.0

# --- State ---
var is_jumping := false
var is_sliding := false
var is_stumbling := false
var is_narrative_paused := false
var jumps_remaining := 2
var current_action := "Idle"
var game_started := false

# --- Platformer Mode ---
var platformer_mode := false       # Permanent (post-morph, all 6 collected)
var temp_platformer := false        # Temporary (during boss encounters)
const PLATFORM_RUN_SPEED := 120.0  # Horizontal movement speed
const PLATFORM_ACCEL := 800.0      # How fast Po reaches full speed
const PLATFORM_FRICTION := 600.0   # How fast Po decelerates

# --- NG+ Attack System ---
var is_ng_plus := false
const ATTACK_COOLDOWN := 0.6         # Shared cooldown between Spirit Fist / Ghost Whip
const GHOST_WHIP_HOLD := 0.25        # Hold threshold to trigger whip vs fist
const GHOST_WHIP_RADIUS := 55.0      # Melee arc radius
const SPIRIT_FIST_SPEED := 350.0     # Projectile speed
const SPIRIT_FIST_RANGE := 700.0     # Max travel distance
const SMOKE_ARM_COLOR := Color(0.5, 0.75, 1.0, 0.7)     # Spectral blue-white
const SMOKE_ARM_FADE := Color(0.5, 0.75, 1.0, 0.0)
const WHIP_ARC_COLOR := Color(0.8, 0.5, 1.0, 0.6)       # Spirit purple arc
const FIST_TRAIL_COLOR := Color(0.5, 0.8, 1.0, 0.5)     # Spectral blue trail

var _attack_cooldown_timer := 0.0
var _attack_held := false
var _attack_hold_timer := 0.0
var _attack_triggered := false  # Prevents double-trigger (whip on hold + fist on release)

# --- Internal timers ---
var coyote_timer := 0.0
var jump_buffer_timer := 0.0
var slide_timer := 0.0
var was_on_floor := true
var _ghost_timer := 0.0
var _speed_line_timer := 0.0
var _run_dust_timer := 0.0

# --- Touch input ---
var _touch_start_pos := Vector2.ZERO
var _touch_active := false
const SWIPE_THRESHOLD := 40.0  # Min pixels to register as swipe

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var collision_shape: CollisionShape2D = $CollisionShape2D
@onready var stumble_timer: Timer = $StumbleTimer

func _ready() -> void:
	stumble_timer.timeout.connect(_on_stumble_recover)
	sprite.play("idle")

func start_running() -> void:
	game_started = true
	sprite.play("run")
	current_action = "Running"

# --- Touch Input ---
func _input(event: InputEvent) -> void:
	if not game_started:
		return
	if event is InputEventScreenTouch:
		if event.pressed:
			_touch_start_pos = event.position
			_touch_active = true
		elif _touch_active:
			_touch_active = false
			# During narrative/stumble, don't process game input —
			# let narrative.gd handle the tap for dialogue advance
			if is_narrative_paused or is_stumbling:
				return
			var swipe = event.position - _touch_start_pos
			if swipe.y > SWIPE_THRESHOLD and abs(swipe.y) > abs(swipe.x) * 1.5:
				# Swipe down → slide
				if is_on_floor() and not is_jumping and not is_sliding:
					_start_slide()
			else:
				# Tap → jump (feeds into jump buffer in _physics_process)
				jump_buffer_timer = JUMP_BUFFER_TIME
			get_viewport().set_input_as_handled()

func _physics_process(delta: float) -> void:
	if not game_started or is_dead:
		return
	# --- Invincibility tick ---
	if _invincible:
		_invincible_timer -= delta
		if _invincible_timer <= 0:
			_invincible = false
			sprite.modulate.a = 1.0
		else:
			# Rapid alpha pulse during i-frames
			sprite.modulate.a = 0.3 if fmod(_invincible_timer, 0.15) < 0.075 else 1.0
	if is_narrative_paused or is_stumbling:
		return

	var on_floor = is_on_floor()

	# --- Coyote time tracking ---
	if on_floor:
		coyote_timer = COYOTE_TIME
		if not was_on_floor:
			# Just landed — squash + dust
			_land_squash()
			_spawn_dust()
			is_jumping = false
			if not is_sliding:
				sprite.play("run")
				current_action = "Running"
	else:
		coyote_timer = max(coyote_timer - delta, 0.0)

	# --- Gravity with apex control ---
	if not on_floor:
		var grav = GRAVITY
		if Input.is_action_pressed("slide") and velocity.y > 0:
			# Fast-fall: press down while falling
			grav = FAST_FALL_GRAVITY
		elif abs(velocity.y) < 80:
			# Apex hang time — less gravity near peak
			grav = GRAVITY * APEX_GRAVITY_MULT
		elif velocity.y < 0 and not Input.is_action_pressed("jump"):
			# Short hop — released jump button while ascending
			grav = GRAVITY * JUMP_CUT_MULT
		velocity.y += grav * delta
	else:
		jumps_remaining = 2 if can_double_jump else 1

	# --- Jump buffer ---
	if Input.is_action_just_pressed("jump"):
		jump_buffer_timer = JUMP_BUFFER_TIME
	if jump_buffer_timer > 0:
		jump_buffer_timer -= delta
		if _can_jump():
			_do_jump()
			jump_buffer_timer = 0.0

	# --- Slide ---
	if Input.is_action_just_pressed("slide") and on_floor and not is_jumping:
		_start_slide()
	if is_sliding:
		slide_timer -= delta
		if slide_timer <= 0:
			_end_slide()
		# Cancel slide into jump for dash-jump combo
		if Input.is_action_just_pressed("jump"):
			_end_slide()
			if _can_jump():
				_do_jump()

	# --- NG+ Attack cooldown + hold detection ---
	if is_ng_plus:
		if _attack_cooldown_timer > 0:
			_attack_cooldown_timer -= delta
		if _attack_held:
			_attack_hold_timer += delta
			if _attack_hold_timer >= GHOST_WHIP_HOLD and not _attack_triggered:
				_attack_triggered = true
				_ghost_whip()

	# --- Ghost trail during jump/slide ---
	if is_jumping or is_sliding:
		_ghost_timer -= delta
		if _ghost_timer <= 0:
			_ghost_timer = GHOST_INTERVAL
			_spawn_ghost(GHOST_SLIDE_COLOR if is_sliding else GHOST_JUMP_COLOR)

	# --- Slide speed lines ---
	if is_sliding:
		_speed_line_timer -= delta
		if _speed_line_timer <= 0:
			_speed_line_timer = SPEED_LINE_INTERVAL
			_spawn_speed_line()

	# --- Run dust (subtle footfall particles) ---
	if on_floor and not is_sliding and not is_stumbling:
		_run_dust_timer -= delta
		if _run_dust_timer <= 0:
			_run_dust_timer = RUN_DUST_INTERVAL
			_spawn_run_dust()

	was_on_floor = on_floor

	# --- Movement mode: auto-runner vs platformer ---
	var has_horizontal = platformer_mode or temp_platformer
	if has_horizontal:
		# Platformer horizontal movement (earned through Forbidden Six / boss fights)
		var dir = Input.get_axis("move_left", "move_right")
		if dir != 0:
			velocity.x = move_toward(velocity.x, dir * PLATFORM_RUN_SPEED, PLATFORM_ACCEL * delta)
			sprite.flip_h = dir < 0
			if on_floor and not is_sliding and not is_jumping:
				if sprite.animation != "run":
					sprite.play("run")
				current_action = "Running"
		else:
			velocity.x = move_toward(velocity.x, 0, PLATFORM_FRICTION * delta)
			if on_floor and not is_jumping and not is_sliding and not is_stumbling:
				if abs(velocity.x) < 5.0:
					if sprite.animation != "idle":
						sprite.play("idle")
					current_action = "Idle"
		move_and_slide()
		if not platformer_mode:
			# Temp mode (encounter): clamp to screen bounds
			position.x = clamp(position.x, 20, 620)
	else:
		# Auto-runner: world scrolls, Po stays locked
		velocity.x = RUN_SPEED
		move_and_slide()
		# Lock horizontal position — world scrolls, Po stays put.
		# Without this, obstacle collisions push Po backward.
		position.x = 100

func _can_jump() -> bool:
	if jumps_remaining <= 0:
		return false
	var max_jumps = 2 if can_double_jump else 1
	# First jump: needs floor or coyote time
	# Air jump: needs remaining jumps (already off floor)
	if is_on_floor() or coyote_timer > 0:
		return true
	if jumps_remaining < max_jumps:
		return true  # This is an air/double jump
	return false

func _do_jump() -> void:
	var is_air_jump = not is_on_floor() and coyote_timer <= 0
	velocity.y = DOUBLE_JUMP_FORCE if is_air_jump else JUMP_FORCE
	jumps_remaining -= 1
	is_jumping = true
	is_sliding = false
	coyote_timer = 0.0
	sprite.play("jump")
	current_action = "Jumping"
	_jump_stretch()
	if is_air_jump:
		_double_jump_burst()

func _start_slide() -> void:
	is_sliding = true
	slide_timer = SLIDE_DURATION
	sprite.play("slide")
	# Shrink collision for sliding under obstacles
	collision_shape.shape.size.y = 20
	collision_shape.position.y = 10
	current_action = "Sliding"
	_ghost_timer = 0.0  # Immediate first ghost
	_speed_line_timer = 0.0  # Immediate first speed line

func _end_slide() -> void:
	is_sliding = false
	collision_shape.shape.size.y = 40
	collision_shape.position.y = 0
	if is_on_floor() and not is_jumping:
		sprite.play("run")
		current_action = "Running"

# ============================================================
# JUICE LAYER — Sly Cooper meets Shinobi 3
# ============================================================

# --- Ghost Afterimage Trail ---
func _spawn_ghost(color: Color) -> void:
	var ghost = Sprite2D.new()
	ghost.texture = sprite.sprite_frames.get_frame_texture(sprite.animation, sprite.frame)
	ghost.global_position = sprite.global_position
	ghost.scale = sprite.scale
	ghost.modulate = color
	ghost.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	ghost.z_index = z_index - 1
	get_parent().add_child(ghost)
	var tween = ghost.create_tween()
	tween.tween_property(ghost, "modulate:a", 0.0, GHOST_FADE_TIME)
	tween.parallel().tween_property(ghost, "scale", ghost.scale * 1.1, GHOST_FADE_TIME)
	tween.tween_callback(ghost.queue_free)

# --- Double Jump Spirit Burst ---
func _double_jump_burst() -> void:
	# Ring of 5 ghosts exploding outward — Po IS a ghost
	for i in range(5):
		var ghost = Sprite2D.new()
		ghost.texture = sprite.sprite_frames.get_frame_texture(sprite.animation, sprite.frame)
		ghost.global_position = sprite.global_position
		ghost.scale = sprite.scale * 0.8
		ghost.modulate = GHOST_DOUBLE_JUMP_COLOR
		ghost.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		ghost.z_index = z_index - 1
		get_parent().add_child(ghost)
		# Radial burst
		var angle = (i / 5.0) * TAU + randf_range(-0.3, 0.3)
		var burst_offset = Vector2(cos(angle), sin(angle)) * 24.0
		var tween = ghost.create_tween()
		tween.set_parallel(true)
		tween.tween_property(ghost, "global_position", ghost.global_position + burst_offset, 0.3)
		tween.tween_property(ghost, "modulate:a", 0.0, 0.3)
		tween.tween_property(ghost, "scale", Vector2.ZERO, 0.35)
		tween.set_parallel(false)
		tween.tween_callback(ghost.queue_free)

# --- Landing Dust ---
func _spawn_dust() -> void:
	for i in range(4):
		var dust = Sprite2D.new()
		# Use a tiny white rect via a placeholder — or just use ColorRect
		var rect = ColorRect.new()
		rect.size = Vector2(3, 3)
		rect.color = DUST_COLOR
		rect.position = Vector2(-1.5, -1.5)
		dust.add_child(rect)
		dust.global_position = global_position + Vector2(randf_range(-12, 12), 18)
		dust.z_index = z_index - 1
		get_parent().add_child(dust)
		var dir = Vector2(randf_range(-40, 40), randf_range(-50, -20))
		var tween = dust.create_tween()
		tween.set_parallel(true)
		tween.tween_property(dust, "global_position", dust.global_position + dir * 0.3, 0.3)
		tween.tween_property(rect, "modulate:a", 0.0, 0.3)
		tween.tween_property(rect, "size", Vector2(1, 1), 0.3)
		tween.set_parallel(false)
		tween.tween_callback(dust.queue_free)

# --- Slide Speed Lines ---
func _spawn_speed_line() -> void:
	# Horizontal streaks that convey blazing speed during slides
	var line = ColorRect.new()
	var length = randf_range(SPEED_LINE_LENGTH_MIN, SPEED_LINE_LENGTH_MAX)
	line.size = Vector2(length, randf_range(1.0, 1.5))
	line.color = Color(1.0, 1.0, 1.0, randf_range(0.12, 0.35))
	# Spawn in a band around Po — some in front, some behind
	line.global_position = global_position + Vector2(
		randf_range(-10, 20),
		randf_range(-22, 16)
	)
	line.z_index = z_index + 1
	get_parent().add_child(line)
	var tween = line.create_tween()
	# Streak zooms left and fades — parallax feel
	tween.tween_property(line, "global_position:x",
		line.global_position.x - randf_range(50, 90), 0.1)
	tween.parallel().tween_property(line, "modulate:a", 0.0, 0.1)
	tween.tween_callback(line.queue_free)

# --- Run Dust (Footfall Particles) ---
func _spawn_run_dust() -> void:
	# Tiny ground particles kicked up each stride — barely visible but felt
	var dust = ColorRect.new()
	dust.size = Vector2(randf_range(1.5, 2.5), randf_range(1.5, 2.5))
	dust.color = Color(0.55, 0.45, 0.3, randf_range(0.15, 0.35))
	dust.global_position = global_position + Vector2(randf_range(-6, 6), 18)
	dust.z_index = z_index - 1
	get_parent().add_child(dust)
	var dir = Vector2(randf_range(-20, -8), randf_range(-15, -5))
	var tween = dust.create_tween()
	tween.set_parallel(true)
	tween.tween_property(dust, "global_position",
		dust.global_position + dir * 0.2, 0.3)
	tween.tween_property(dust, "modulate:a", 0.0, 0.3)
	tween.tween_property(dust, "size", Vector2(0.5, 0.5), 0.3)
	tween.set_parallel(false)
	tween.tween_callback(dust.queue_free)

# --- Squash & Stretch ---
func _land_squash() -> void:
	var tween = create_tween()
	tween.tween_property(sprite, "scale", Vector2(2.3, 1.7), 0.04)
	tween.tween_property(sprite, "scale", Vector2(2.0, 2.0), 0.08)

func _jump_stretch() -> void:
	var tween = create_tween()
	tween.tween_property(sprite, "scale", Vector2(1.7, 2.4), 0.05)
	tween.tween_property(sprite, "scale", Vector2(2.0, 2.0), 0.1)

# --- Hit / Stumble ---
func stumble(damage: int = 1) -> void:
	if is_stumbling or is_narrative_paused or _invincible or is_dead:
		return
	health -= damage
	health_changed.emit(health, max_health)
	if health <= 0:
		health = 0
		_die()
		return
	is_stumbling = true
	current_action = "Stumbled"
	sprite.play("stumble")
	velocity = Vector2.ZERO
	stumble_timer.start(STUMBLE_DURATION)
	stumbled.emit()
	_hit_freeze()
	_screen_shake()
	_stumble_blink()
	# Start invincibility frames
	_invincible = true
	_invincible_timer = INVINCIBILITY_DURATION

func _die() -> void:
	is_dead = true
	is_stumbling = true
	current_action = "Dead"
	sprite.play("stumble")
	velocity = Vector2.ZERO
	_hit_freeze()
	_screen_shake()
	# Death blink — slower, more dramatic than stumble
	var blink = create_tween()
	for i in range(8):
		blink.tween_property(sprite, "modulate:a", 0.0, 0.06)
		blink.tween_property(sprite, "modulate:a", 0.8, 0.06)
	blink.tween_property(sprite, "modulate:a", 0.3, 0.1)
	died.emit()

func _hit_freeze() -> void:
	# Fighting game impact pause — world stops for a heartbeat
	Engine.time_scale = 0.05
	get_tree().create_timer(HIT_FREEZE_TIME, true, false, true).timeout.connect(_unfreeze)

func _unfreeze() -> void:
	Engine.time_scale = 1.0

func _stumble_blink() -> void:
	# Rapid blink during stumble — classic hit feedback
	var blink = create_tween()
	for i in range(5):
		blink.tween_property(sprite, "modulate:a", 0.15, 0.04)
		blink.tween_property(sprite, "modulate:a", 1.0, 0.04)

func _screen_shake() -> void:
	var original_pos = position
	var tween = create_tween()
	for i in range(5):
		var intensity = 5.0 - (i * 0.8)  # Decaying shake
		var shake_x = randf_range(-intensity, intensity)
		var shake_y = randf_range(-intensity * 0.5, intensity * 0.5)
		tween.tween_property(self, "position", original_pos + Vector2(shake_x, shake_y), 0.03)
	tween.tween_property(self, "position", original_pos, 0.03)

func _on_stumble_recover() -> void:
	if is_dead:
		return
	is_stumbling = false
	sprite.play("run")
	current_action = "Running"

# --- Pick Collection ---
func collect_pick(value: int = 1, heals: bool = false, food_name: String = "") -> void:
	pick_collected.emit(value, food_name)
	if heals and health < max_health:
		health = mini(health + 1, max_health)
		health_changed.emit(health, max_health)
		_heal_flash()
	else:
		_pick_flash()

func _heal_flash() -> void:
	# Green pulse on heal — distinct from amber pick flash
	sprite.modulate = HEAL_FLASH_COLOR
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color.WHITE, 0.2)
	tween.parallel().tween_property(sprite, "scale", Vector2(2.2, 2.2), 0.08)
	tween.tween_property(sprite, "scale", Vector2(2.0, 2.0), 0.12)

func _pick_flash() -> void:
	# Overbright amber flash + scale pop
	sprite.modulate = PICK_FLASH_COLOR
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color.WHITE, 0.15)
	tween.parallel().tween_property(sprite, "scale", Vector2(2.3, 2.3), 0.06)
	tween.tween_property(sprite, "scale", Vector2(2.0, 2.0), 0.1)

# --- Enemy Defeat ---
func stomp_bounce() -> void:
	# Weaker than double jump — Po bounces off defeated enemy
	velocity.y = DOUBLE_JUMP_FORCE * 0.7
	is_jumping = true
	jumps_remaining = max(jumps_remaining, 1)  # Allow one more air jump after stomp
	sprite.play("jump")
	current_action = "Jumping"
	_jump_stretch()

func slide_defeat_flash() -> void:
	# Golden flash when defeating enemy with slide
	sprite.modulate = Color(1.5, 1.3, 0.8, 1.0)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color.WHITE, 0.12)
	# Extra ghost trails in gold
	for i in range(3):
		_spawn_ghost(GHOST_DEFEAT_COLOR)

# --- Narrative ---
func enter_narrative() -> void:
	is_narrative_paused = true
	velocity = Vector2.ZERO
	sprite.play("idle")
	current_action = "Talking"

func exit_narrative() -> void:
	is_narrative_paused = false
	if platformer_mode:
		sprite.play("idle")
		current_action = "Idle"
	else:
		sprite.play("run")
		current_action = "Running"

# ============================================================
# PLATFORMER MODE — Earned through the Forbidden Six
# ============================================================

func activate_temp_platformer() -> void:
	## Temporary horizontal movement during boss encounters.
	temp_platformer = true

func deactivate_temp_platformer() -> void:
	## Back to auto-runner lock after encounter ends.
	temp_platformer = false
	velocity.x = 0
	position.x = 100  # Re-lock to runner position

func activate_platformer_mode() -> void:
	## Permanent platformer mode — all 6 artifacts collected, reality breaks.
	platformer_mode = true
	temp_platformer = false  # Permanent overrides temp
	# Golden reality-break flash
	sprite.modulate = Color(2.0, 1.5, 1.0, 1.0)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color.WHITE, 0.5)

# ============================================================
# NG+ SYSTEM — Upgraded Po
# ============================================================

func activate_ng_plus() -> void:
	is_ng_plus = true
	max_health = NG_PLUS_HEALTH
	health = max_health
	health_changed.emit(health, max_health)
	# Swap to crimson NG+ sprites if available
	if ResourceLoader.exists("res://sprites/po_ng_plus/run/frame_000.png"):
		_swap_ng_plus_sprites()
	else:
		# Fallback tint if sprites not found
		sprite.modulate = Color(1.2, 0.85, 0.85, 1.0)

func _swap_ng_plus_sprites() -> void:
	var sf := SpriteFrames.new()
	var base := "res://sprites/po_ng_plus/"
	# Animation config: [name, folder, frame_count, fps, loop, frame_prefix, frame_digits]
	var anims := [
		["run", "run", 6, 10.0, true, "frame_", 3],
		["idle", "idle", 4, 4.0, true, "frame_", 3],
		["jump", "jump", 9, 14.0, false, "frame_", 3],
		["slide", "slide", 5, 10.0, false, "frame_", 3],
		["stumble", "stumble", 6, 8.0, false, "frame_", 3],
		["cross_punch", "cross_punch", 6, 12.0, false, "frame_", 3],
		["fireball", "fireball", 6, 12.0, false, "frame_", 3],
	]
	# Remove default animation
	if sf.has_animation("default"):
		sf.remove_animation("default")
	for anim_data in anims:
		var anim_name: String = anim_data[0]
		var folder: String = anim_data[1]
		var frame_count: int = anim_data[2]
		var fps: float = anim_data[3]
		var loop: bool = anim_data[4]
		var prefix: String = anim_data[5]
		var digits: int = anim_data[6]
		sf.add_animation(anim_name)
		sf.set_animation_speed(anim_name, fps)
		sf.set_animation_loop(anim_name, loop)
		for i in range(frame_count):
			var frame_num: String = str(i)
			while frame_num.length() < digits:
				frame_num = "0" + frame_num
			var path: String = base + folder + "/" + prefix + frame_num + ".png"
			if ResourceLoader.exists(path):
				var tex: Texture2D = load(path)
				sf.add_frame(anim_name, tex)
	sprite.sprite_frames = sf
	sprite.play("run")

# --- Attack Input ---

func attack_press() -> void:
	if not is_ng_plus or not game_started or is_dead or is_stumbling or is_narrative_paused:
		return
	if _attack_cooldown_timer > 0:
		return
	_attack_held = true
	_attack_hold_timer = 0.0
	_attack_triggered = false

func attack_release() -> void:
	if not _attack_held:
		return
	_attack_held = false
	# If whip already triggered on hold, don't also fire fist
	if _attack_triggered:
		return
	# Tap release → Spirit Fist
	_spirit_fist()

# --- Spirit Fist (Ranged Projectile) ---

func _spirit_fist() -> void:
	_attack_cooldown_timer = ATTACK_COOLDOWN
	_attack_triggered = true
	current_action = "Attacking"
	sprite.play("fireball")
	_spawn_smoke_arm()
	# Emit signal so main.gd can spawn the projectile scene
	var spawn_pos = global_position + Vector2(20, -5)
	attack_fired.emit("spirit_fist", spawn_pos)
	# Return to run after animation completes (6 frames @ 12fps = 0.5s)
	var tween = create_tween()
	tween.tween_interval(0.35)
	tween.tween_callback(func():
		if not is_stumbling and not is_dead and not is_narrative_paused:
			if is_on_floor() and not is_jumping and not is_sliding:
				sprite.play("run")
				current_action = "Running"
	)

# --- Ghost Whip (Melee Arc) ---

func _ghost_whip() -> void:
	_attack_cooldown_timer = ATTACK_COOLDOWN
	current_action = "Attacking"
	sprite.play("cross_punch")
	_spawn_smoke_arm()
	# Sweep visual — arc of spectral afterimages
	_spawn_whip_arc()
	# Instant melee check — hit all enemies within radius
	var defeated_count := 0
	for enemy in get_tree().get_nodes_in_group("enemies"):
		var dist = global_position.distance_to(enemy.global_position)
		if dist <= GHOST_WHIP_RADIUS:
			if enemy.has_method("take_hit"):
				enemy.take_hit()
			elif enemy.has_method("defeat"):
				enemy.defeat()
			defeated_count += 1
	if defeated_count > 0:
		slide_defeat_flash()  # Reuse golden feedback
	# Return to run after animation completes (6 frames @ 12fps = 0.5s)
	var tween = create_tween()
	tween.tween_interval(0.35)
	tween.tween_callback(func():
		if not is_stumbling and not is_dead and not is_narrative_paused:
			if is_on_floor() and not is_jumping and not is_sliding:
				sprite.play("run")
				current_action = "Running"
	)

# --- Smoke Arm VFX (Shared Foundation) ---

func _spawn_smoke_arm() -> void:
	## 6 spectral smoke particles burst from arm position.
	## Arm phases in/out of reality — the djinn world bleeding through.
	var arm_pos = global_position + Vector2(14, -8)
	# Arm flash — brief spectral rectangle
	var arm = ColorRect.new()
	arm.size = Vector2(10, 4)
	arm.color = SMOKE_ARM_COLOR
	arm.global_position = arm_pos
	arm.z_index = z_index + 1
	get_parent().add_child(arm)
	var arm_tween = arm.create_tween()
	arm_tween.tween_property(arm, "modulate:a", 0.0, 0.2)
	arm_tween.tween_callback(arm.queue_free)
	# Smoke particles
	for i in range(6):
		var p = ColorRect.new()
		var size = randf_range(2.0, 4.0)
		p.size = Vector2(size, size)
		p.color = Color(SMOKE_ARM_COLOR.r, SMOKE_ARM_COLOR.g, SMOKE_ARM_COLOR.b, randf_range(0.3, 0.6))
		p.global_position = arm_pos + Vector2(randf_range(-4, 8), randf_range(-6, 6))
		p.z_index = z_index + 1
		get_parent().add_child(p)
		var drift = Vector2(randf_range(5, 25), randf_range(-20, -5))
		var tween = p.create_tween()
		tween.set_parallel(true)
		tween.tween_property(p, "global_position", p.global_position + drift * 0.3, 0.2)
		tween.tween_property(p, "modulate:a", 0.0, 0.2)
		tween.tween_property(p, "size", Vector2(0.5, 0.5), 0.2)
		tween.set_parallel(false)
		tween.tween_callback(p.queue_free)

# --- Ghost Whip Arc Visual ---

func _spawn_whip_arc() -> void:
	## Curved arc of 5 spectral afterimages sweeping in front of Po.
	var base_pos = global_position + Vector2(10, -5)
	for i in range(5):
		var ghost = ColorRect.new()
		ghost.size = Vector2(6, 3)
		ghost.color = WHIP_ARC_COLOR
		# Arc positions — sweep from top-right to bottom-right
		var angle = lerp(-0.8, 0.8, float(i) / 4.0)
		var offset = Vector2(cos(angle) * 30, sin(angle) * 25)
		ghost.global_position = base_pos + offset
		ghost.rotation = angle
		ghost.z_index = z_index + 1
		get_parent().add_child(ghost)
		# Staggered appear → fade
		var tween = ghost.create_tween()
		tween.tween_interval(i * 0.02)  # Stagger
		tween.tween_property(ghost, "modulate:a", 0.0, 0.15)
		tween.parallel().tween_property(ghost, "scale", Vector2(1.5, 0.5), 0.15)
		tween.tween_callback(ghost.queue_free)
