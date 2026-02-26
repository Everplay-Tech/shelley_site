extends Area2D
## Enemy projectile — falls downward toward the player.

const SPEED := 200.0

var bullet_color := Color(0.3, 0.8, 0.2, 0.9)  # Green paint by default
var _trail_timer := 0.0

func _ready() -> void:
	# Visual: colored glob
	var rect := ColorRect.new()
	rect.size = Vector2(5, 5)
	rect.position = Vector2(-2.5, -2.5)
	rect.color = bullet_color
	add_child(rect)
	# Glow
	var glow := ColorRect.new()
	glow.size = Vector2(7, 7)
	glow.position = Vector2(-3.5, -3.5)
	glow.color = Color(bullet_color.r, bullet_color.g, bullet_color.b, 0.25)
	add_child(glow)
	glow.z_index = -1
	# Collision
	var shape := CollisionShape2D.new()
	var rect_shape := RectangleShape2D.new()
	rect_shape.size = Vector2(5, 5)
	shape.shape = rect_shape
	add_child(shape)
	# Collision setup
	collision_layer = 16   # Enemy bullets
	collision_mask = 2     # Player

func _process(delta: float) -> void:
	position.y += SPEED * delta
	# Trail
	_trail_timer += delta
	if _trail_timer >= 0.05:
		_trail_timer = 0.0
		_spawn_trail()
	# Off screen
	if position.y > 380:
		queue_free()

func _spawn_trail() -> void:
	var trail := ColorRect.new()
	var s: float = randf_range(1.5, 2.5)
	trail.size = Vector2(s, s)
	trail.position = global_position + Vector2(randf_range(-2, 2), -3)
	trail.color = Color(bullet_color.r, bullet_color.g, bullet_color.b, 0.3)
	get_parent().add_child(trail)
	var tween := trail.create_tween()
	tween.tween_property(trail, "color:a", 0.0, 0.2)
	tween.tween_callback(trail.queue_free)
