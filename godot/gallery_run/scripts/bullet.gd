extends Area2D
## Player bullet — fires upward from the Axis Mundi.

const SPEED := 400.0

var _trail_timer := 0.0

func _ready() -> void:
	# Visual: small amber bolt
	var rect := ColorRect.new()
	rect.size = Vector2(4, 8)
	rect.position = Vector2(-2, -4)
	rect.color = Color(1.0, 0.75, 0.0, 0.9)  # Amber
	add_child(rect)
	# Glow outline
	var glow := ColorRect.new()
	glow.size = Vector2(6, 10)
	glow.position = Vector2(-3, -5)
	glow.color = Color(1.0, 0.85, 0.3, 0.3)
	add_child(glow)
	glow.z_index = -1
	# Collision
	var shape := CollisionShape2D.new()
	var rect_shape := RectangleShape2D.new()
	rect_shape.size = Vector2(4, 8)
	shape.shape = rect_shape
	add_child(shape)
	# Collision setup
	collision_layer = 4   # Player bullets
	collision_mask = 8     # Enemies

func _process(delta: float) -> void:
	position.y -= SPEED * delta
	# Trail particles
	_trail_timer += delta
	if _trail_timer >= 0.04:
		_trail_timer = 0.0
		_spawn_trail()
	# Off screen
	if position.y < -20:
		queue_free()

func _spawn_trail() -> void:
	var trail := ColorRect.new()
	var s: float = randf_range(1.0, 2.0)
	trail.size = Vector2(s, s)
	trail.position = global_position + Vector2(randf_range(-2, 2), 4)
	trail.color = Color(1.0, 0.75, 0.0, 0.4)
	get_parent().add_child(trail)
	var tween: Tween = trail.create_tween()
	tween.tween_property(trail, "color:a", 0.0, 0.2)
	tween.tween_callback(trail.queue_free)
