extends Area2D
## Debt bill projectile — dropped by Spidat during flyby.
## Falls with paper-flutter motion (sine-wave x drift).
## Rizky: swap sprite, adjust flutter freq/amp for different paper types.
## NOTE: Base projectile logic inlined due to Godot headless export limitation.
##       If refactoring, extract common code to base_projectile.gd and inherit in editor.

signal projectile_hit(body: Node2D)

var vel := Vector2.ZERO
@export var fall_gravity := 200.0
@export var spin_speed := 0.0
@export var lifetime := 5.0
@export var despawn_margin := 60.0

var _active := true
var _age := 0.0
var _flutter_time := 0.0

const FLUTTER_FREQUENCY := 6.0   # How fast it sways side to side
const FLUTTER_AMPLITUDE := 30.0  # How wide it sways
const BASE_DRIFT_X := -15.0      # Slight leftward drift (world motion feel)

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	vel = Vector2(BASE_DRIFT_X, 40.0)

func _process(delta: float) -> void:
	if not _active:
		return
	# Paper flutter — gentle sine-wave horizontal sway
	_flutter_time += delta
	vel.x = BASE_DRIFT_X + sin(_flutter_time * FLUTTER_FREQUENCY) * FLUTTER_AMPLITUDE
	vel.y += fall_gravity * delta
	position += vel * delta
	if spin_speed != 0.0:
		rotation += spin_speed * delta
	_age += delta
	if _age >= lifetime:
		queue_free()
		return
	if position.x < -despawn_margin or position.x > 700 + despawn_margin:
		queue_free()
		return
	if position.y > 380 or position.y < -200:
		queue_free()

func _on_body_entered(body: Node2D) -> void:
	if not _active:
		return
	_active = false
	projectile_hit.emit(body)
	if body.has_method("stumble"):
		body.stumble()
	queue_free()
