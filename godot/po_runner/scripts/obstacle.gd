extends StaticBody2D
## An obstacle that scrolls left. Detects collision with Po.

@export var scroll_speed := 200.0

var _hit := false

func _process(delta: float) -> void:
	position.x -= scroll_speed * delta
	# Remove when off-screen left
	if position.x < -100:
		queue_free()

func _on_hit_area_body_entered(body: Node2D) -> void:
	if _hit:
		return
	if body.has_method("stumble"):
		_hit = true
		body.stumble()
