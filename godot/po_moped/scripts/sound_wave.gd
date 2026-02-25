extends Area2D
## Sound wave — Electric Screamer projectile. Travels left with blue ripple VFX.

const BASE_SPEED := 200.0
const WAVE_COLOR := Color(0.4, 0.6, 1.0, 0.85)
var speed_mult := 1.0
var _time := 0.0
var _trail_timer := 0.0

func _ready() -> void:
	# Blue ripple visual
	var body = ColorRect.new()
	body.size = Vector2(10, 6)
	body.position = Vector2(-5, -3)
	body.color = WAVE_COLOR
	add_child(body)

	var core = ColorRect.new()
	core.size = Vector2(6, 2)
	core.position = Vector2(-3, -1)
	core.color = Color(0.7, 0.85, 1.0, 1.0)
	add_child(core)

	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(10, 6)
	shape.shape = rect
	add_child(shape)

	collision_layer = 0
	collision_mask = 2  # Layer 2 = player
	area_entered.connect(_on_area_hit)

func _process(delta: float) -> void:
	_time += delta
	var dir = Vector2.LEFT.rotated(rotation)
	position += dir * BASE_SPEED * speed_mult * delta

	# Pulse
	modulate.a = 0.7 + sin(_time * 10) * 0.3

	# Trail
	_trail_timer -= delta
	if _trail_timer <= 0.0:
		_spawn_trail()
		_trail_timer = 0.04

	if position.x < -30 or position.x > 700 or position.y < -30 or position.y > 400:
		queue_free()

func _spawn_trail() -> void:
	var t = ColorRect.new()
	t.size = Vector2(4, 3)
	t.color = Color(0.3, 0.5, 0.9, 0.4)
	t.position = global_position + Vector2(randf_range(0, 5), randf_range(-2, 2))
	t.z_index = z_index - 1
	get_parent().add_child(t)
	var tw = get_tree().create_tween()
	tw.tween_property(t, "modulate:a", 0.0, 0.15)
	tw.tween_callback(t.queue_free)

func _on_area_hit(area: Node) -> void:
	if area.has_method("take_damage"):
		area.take_damage()
		queue_free()
