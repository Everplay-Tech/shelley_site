extends Area2D
## Falling envelope — catch for points, miss for penalty.
## Magnet envelopes grant 3s auto-catch radius.

signal caught(envelope: Area2D)
signal missed(envelope: Area2D)

var fall_speed := 150.0
var is_magnet := false
var _caught := false

func _ready() -> void:
	# Visual — envelope rectangle (placeholder until sprites arrive)
	var body = ColorRect.new()
	if is_magnet:
		body.size = Vector2(14, 10)
		body.color = Color(0.6, 0.3, 0.8, 0.9)  # Purple magnet
		body.position = Vector2(-7, -5)
	else:
		# Random envelope color variants
		var colors = [
			Color(0.95, 0.85, 0.6, 1.0),   # Cream
			Color(0.85, 0.75, 0.55, 1.0),   # Parchment
			Color(0.9, 0.9, 0.8, 1.0),      # Off-white
			Color(0.8, 0.7, 0.5, 1.0),      # Kraft
		]
		body.size = Vector2(12, 8)
		body.color = colors[randi() % colors.size()]
		body.position = Vector2(-6, -4)
	add_child(body)

	# Seal/flap accent
	var seal = ColorRect.new()
	if is_magnet:
		seal.size = Vector2(6, 3)
		seal.color = Color(0.8, 0.4, 1.0, 0.8)  # Bright purple
		seal.position = Vector2(-3, -5)
	else:
		seal.size = Vector2(5, 3)
		seal.color = Color(0.8, 0.2, 0.2, 0.7)  # Red wax seal
		seal.position = Vector2(-2.5, -4)
	add_child(seal)

	# Collision shape
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(12, 8)
	shape.shape = rect
	add_child(shape)

func _process(delta: float) -> void:
	if _caught:
		return
	position.y += fall_speed * delta

	# Slight horizontal drift for visual interest
	position.x += sin(position.y * 0.05) * 0.3

	# Missed — fell below viewport
	if position.y > 370:
		missed.emit(self)
		queue_free()

func catch_it() -> void:
	if _caught:
		return
	_caught = true
	caught.emit(self)
	_spawn_catch_vfx()

func _spawn_catch_vfx() -> void:
	# Amber burst particles
	for i in range(4):
		var p = ColorRect.new()
		var size: float = randf_range(2.0, 4.0)
		p.size = Vector2(size, size)
		p.color = Color(1.0, 0.75, 0.0, 0.8)  # Amber
		p.global_position = global_position + Vector2(randf_range(-6, 6), randf_range(-6, 6))
		get_parent().add_child(p)
		var dir = Vector2(randf_range(-30, 30), randf_range(-50, -10))
		var tween = p.create_tween()
		tween.set_parallel(true)
		tween.tween_property(p, "global_position", p.global_position + dir * 0.3, 0.3)
		tween.tween_property(p, "modulate:a", 0.0, 0.3)
		tween.set_parallel(false)
		tween.tween_callback(p.queue_free)

	# Floating "+1" label
	var lbl = Label.new()
	lbl.text = "+1"
	lbl.add_theme_font_size_override("font_size", 10)
	lbl.add_theme_color_override("font_color", Color(1.0, 0.75, 0.0, 1.0))
	lbl.global_position = global_position + Vector2(-6, -12)
	get_parent().add_child(lbl)
	var tween = lbl.create_tween()
	tween.set_parallel(true)
	tween.tween_property(lbl, "global_position:y", lbl.global_position.y - 20, 0.5)
	tween.tween_property(lbl, "modulate:a", 0.0, 0.5)
	tween.set_parallel(false)
	tween.tween_callback(lbl.queue_free)

	queue_free()
