extends Area2D
## Generic projectile base class — reusable across games.
## Moves via vel + optional fall_gravity. Damages bodies on contact.
## Subclasses override _on_hit() for custom effects, or _process() for custom motion.
##
## NOTE: "vel" and "fall_gravity" instead of "velocity"/"gravity" because
##       Area2D has native members with those names in Godot 4.x.
##
## Usage:
##   var proj = projectile_scene.instantiate()
##   proj.vel = Vector2(-200, -100)
##   proj.fall_gravity = 350.0
##   add_child(proj)

signal projectile_hit(body: Node2D)

var vel := Vector2.ZERO
@export var fall_gravity := 0.0
@export var spin_speed := 0.0       # Radians/sec rotation
@export var lifetime := 5.0         # Auto-despawn after N seconds
@export var despawn_margin := 60.0  # Off-screen margin before despawn

var _active := true
var _age := 0.0

func _ready() -> void:
	# Ensure collision detection is wired
	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	if not _active:
		return

	# Physics
	vel.y += fall_gravity * delta
	position += vel * delta

	# Spin (tumbling sock, fluttering paper, etc)
	if spin_speed != 0.0:
		rotation += spin_speed * delta

	# Age-based despawn
	_age += delta
	if _age >= lifetime:
		queue_free()
		return

	# Off-screen despawn
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
	_on_hit(body)

## Override for custom hit effects (particles, sound, etc).
func _on_hit(_body: Node2D) -> void:
	queue_free()
