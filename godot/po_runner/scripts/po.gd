extends CharacterBody2D
## Po character controller — Sega Genesis feel (Shinobi 3 / Contra Hard Corps).
## Auto-runs, player controls jump, slide, and fast-fall.
## Tuned for snappy, responsive inputs with juice effects.

signal stumbled
signal pick_collected(value: int)

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

@export var can_double_jump := true

# --- State ---
var is_jumping := false
var is_sliding := false
var is_stumbling := false
var is_narrative_paused := false
var jumps_remaining := 2
var current_action := "Running"

# --- Internal timers ---
var coyote_timer := 0.0
var jump_buffer_timer := 0.0
var slide_timer := 0.0
var was_on_floor := true

# --- Touch input ---
var _touch_start_pos := Vector2.ZERO
var _touch_active := false
const SWIPE_THRESHOLD := 40.0  # Min pixels to register as swipe

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var collision_shape: CollisionShape2D = $CollisionShape2D
@onready var stumble_timer: Timer = $StumbleTimer

func _ready() -> void:
	stumble_timer.timeout.connect(_on_stumble_recover)
	sprite.play("run")
	print("PO READY — pos: ", global_position, " visible: ", visible, " sprite visible: ", sprite.visible, " sprite frames: ", sprite.sprite_frames != null, " texture: ", sprite.sprite_frames.get_frame_texture(&"run", 0) if sprite.sprite_frames else "NO FRAMES")

# --- Touch Input ---
func _input(event: InputEvent) -> void:
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
	if is_narrative_paused or is_stumbling:
		return

	var on_floor = is_on_floor()

	# --- Coyote time tracking ---
	if on_floor:
		coyote_timer = COYOTE_TIME
		if not was_on_floor:
			# Just landed — squash effect
			_land_squash()
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

	was_on_floor = on_floor
	velocity.x = RUN_SPEED
	move_and_slide()

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

func _start_slide() -> void:
	is_sliding = true
	slide_timer = SLIDE_DURATION
	sprite.play("slide")
	# Shrink collision for sliding under obstacles
	collision_shape.shape.size.y = 20
	collision_shape.position.y = 10
	current_action = "Sliding"

func _end_slide() -> void:
	is_sliding = false
	collision_shape.shape.size.y = 40
	collision_shape.position.y = 0
	if is_on_floor() and not is_jumping:
		sprite.play("run")
		current_action = "Running"

# --- Juice: Squash & Stretch ---
func _land_squash() -> void:
	var tween = create_tween()
	tween.tween_property(sprite, "scale", Vector2(2.3, 1.7), 0.04)
	tween.tween_property(sprite, "scale", Vector2(2.0, 2.0), 0.08)

func _jump_stretch() -> void:
	var tween = create_tween()
	tween.tween_property(sprite, "scale", Vector2(1.7, 2.4), 0.05)
	tween.tween_property(sprite, "scale", Vector2(2.0, 2.0), 0.1)

# --- Hit / Stumble ---
func stumble() -> void:
	if is_stumbling or is_narrative_paused:
		return
	is_stumbling = true
	current_action = "Stumbled"
	sprite.play("stumble")
	velocity = Vector2.ZERO
	stumble_timer.start(STUMBLE_DURATION)
	stumbled.emit()
	_screen_shake()

func _screen_shake() -> void:
	var original_pos = position
	var tween = create_tween()
	for i in range(4):
		var shake_x = randf_range(-4, 4)
		var shake_y = randf_range(-2, 2)
		tween.tween_property(self, "position", original_pos + Vector2(shake_x, shake_y), 0.03)
	tween.tween_property(self, "position", original_pos, 0.03)

func _on_stumble_recover() -> void:
	is_stumbling = false
	sprite.play("run")
	current_action = "Running"

# --- Narrative ---
func enter_narrative() -> void:
	is_narrative_paused = true
	velocity = Vector2.ZERO
	sprite.play("idle")
	current_action = "Talking"

func exit_narrative() -> void:
	is_narrative_paused = false
	sprite.play("run")
	current_action = "Running"

func collect_pick(value: int = 1) -> void:
	pick_collected.emit(value)
