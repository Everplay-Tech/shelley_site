extends Area2D
## Ground shockwave — travels left along floor, damages Po on contact.
## Spawned by Mantigre's Billie Jean stomp attack.
## Visual: amber-red ground crack that fades as it reaches max range.

@export var speed := 300.0
@export var max_distance := 200.0
@export var damage := 1

var _traveled := 0.0
var _active := true

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	if not _active:
		return
	var move_dist = speed * delta
	position.x -= move_dist
	_traveled += move_dist
	# Fade as it reaches max range
	if _traveled > max_distance * 0.7:
		modulate.a = lerpf(1.0, 0.0, (_traveled - max_distance * 0.7) / (max_distance * 0.3))
	if _traveled >= max_distance:
		queue_free()

func _on_body_entered(body: Node2D) -> void:
	if not _active:
		return
	_active = false
	if body.has_method("stumble"):
		body.stumble(damage)
	queue_free()
