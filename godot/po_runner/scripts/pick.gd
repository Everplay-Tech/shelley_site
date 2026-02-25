extends Area2D
## Collectible orb that scrolls left with the world.
## Bobs up and down for visibility. Glows amber.
## Carries food metadata for healing and trophy tracking.

@export var scroll_speed := 200.0
@export var value := 1
@export var food_name := ""
@export var heals := false

var _time := 0.0

func _ready() -> void:
	add_to_group("world_scrollable")

func _process(delta: float) -> void:
	position.x -= scroll_speed * delta
	# Gentle bob for juice
	_time += delta
	$Sprite2D.offset.y = sin(_time * 4.0) * 3.0
	if position.x < -50:
		queue_free()

func _on_body_entered(body: Node2D) -> void:
	if body.has_method("collect_pick"):
		body.collect_pick(value, heals, food_name)
		queue_free()
