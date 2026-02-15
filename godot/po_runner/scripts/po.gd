extends CharacterBody2D
## Po character controller — auto-runs, player controls jump and slide.

signal stumbled
signal pick_collected(value: int)

const GRAVITY := 900.0
const JUMP_FORCE := -350.0
const RUN_SPEED := 0.0  # Po doesn't move horizontally — the world scrolls

@export var can_double_jump := true

var is_jumping := false
var is_sliding := false
var is_stumbling := false
var is_narrative_paused := false
var jumps_remaining := 2
var current_action := "Running"

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var collision_shape: CollisionShape2D = $CollisionShape2D
@onready var stumble_timer: Timer = $StumbleTimer

func _ready() -> void:
	stumble_timer.timeout.connect(_on_stumble_recover)
	sprite.play("run")

func _physics_process(delta: float) -> void:
	if is_narrative_paused:
		return

	if is_stumbling:
		return

	# Gravity
	if not is_on_floor():
		velocity.y += GRAVITY * delta
	else:
		jumps_remaining = 2 if can_double_jump else 1
		if is_jumping:
			is_jumping = false
			sprite.play("run")
			current_action = "Running"

	# Jump input
	if Input.is_action_just_pressed("jump") and jumps_remaining > 0:
		velocity.y = JUMP_FORCE
		jumps_remaining -= 1
		is_jumping = true
		is_sliding = false
		sprite.play("jump")
		current_action = "Jumping"

	# Slide input
	if Input.is_action_pressed("slide") and is_on_floor() and not is_jumping:
		if not is_sliding:
			is_sliding = true
			sprite.play("slide")
			# Shrink collision for sliding under obstacles
			collision_shape.shape.size.y = 20
			collision_shape.position.y = 10
			current_action = "Sliding"
	elif is_sliding and not Input.is_action_pressed("slide"):
		_end_slide()

	velocity.x = RUN_SPEED
	move_and_slide()

func _end_slide() -> void:
	is_sliding = false
	collision_shape.shape.size.y = 40
	collision_shape.position.y = 0
	if is_on_floor():
		sprite.play("run")
		current_action = "Running"

func stumble() -> void:
	if is_stumbling or is_narrative_paused:
		return
	is_stumbling = true
	current_action = "Stumbled"
	sprite.play("stumble")
	velocity = Vector2.ZERO
	stumble_timer.start(0.6)
	stumbled.emit()

func _on_stumble_recover() -> void:
	is_stumbling = false
	sprite.play("run")
	current_action = "Running"

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
