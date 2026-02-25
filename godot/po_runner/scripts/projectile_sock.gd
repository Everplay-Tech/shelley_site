extends Area2D
## Smelly sock projectile — thrown by Spidat during confrontation.
## Arcs toward Po with gravity + tumble spin.
## Rizky: swap sprite, adjust fall_gravity/spin for different feel.
## NOTE: Base projectile logic inlined due to Godot headless export limitation.
##       If refactoring, extract common code to base_projectile.gd and inherit in editor.

signal projectile_hit(body: Node2D)

var vel := Vector2.ZERO              # Set by spawning enemy (aimed at Po)
@export var fall_gravity := 350.0
@export var spin_speed := 8.0        # Tumble rotation for comedic effect
@export var lifetime := 5.0
@export var despawn_margin := 60.0

var _active := true
var _age := 0.0

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	if not _active:
		return
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
