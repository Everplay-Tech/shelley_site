extends Area2D
## Collectible guitar pick that scrolls left with the world.

@export var scroll_speed := 200.0
@export var value := 1

func _process(delta: float) -> void:
	position.x -= scroll_speed * delta
	if position.x < -50:
		queue_free()

func _on_body_entered(body: Node2D) -> void:
	if body.has_method("collect_pick"):
		body.collect_pick(value)
		queue_free()
