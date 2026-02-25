extends Area2D
## Note bomb — Bass Bomber's vertical drop. Falls with slight drift, dark eighth-note.

const FALL_SPEED := 180.0
const DRIFT_SPEED := -30.0
const BOMB_COLOR := Color(0.25, 0.1, 0.35, 0.9)  # Dark purple

var _time := 0.0
var _trail_timer := 0.0

func _ready() -> void:
	var body = ColorRect.new()
	body.size = Vector2(6, 8)
	body.position = Vector2(-3, -4)
	body.color = BOMB_COLOR
	add_child(body)

	# Note stem
	var stem = ColorRect.new()
	stem.size = Vector2(1, 6)
	stem.position = Vector2(2, -10)
	stem.color = BOMB_COLOR
	add_child(stem)

	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(6, 8)
	shape.shape = rect
	add_child(shape)

	collision_layer = 0
	collision_mask = 2  # Layer 2 = player
	area_entered.connect(_on_area_hit)

func _process(delta: float) -> void:
	_time += delta
	position.y += FALL_SPEED * delta
	position.x += DRIFT_SPEED * delta

	# Rotation wobble
	rotation = sin(_time * 5) * 0.15

	# Trail
	_trail_timer -= delta
	if _trail_timer <= 0.0:
		_spawn_trail()
		_trail_timer = 0.06

	if position.y > 400:
		queue_free()

func _spawn_trail() -> void:
	var t = ColorRect.new()
	t.size = Vector2(3, 3)
	t.color = Color(0.3, 0.15, 0.4, 0.4)
	t.position = global_position + Vector2(randf_range(-2, 2), randf_range(-3, 0))
	t.z_index = z_index - 1
	get_parent().add_child(t)
	var tw = get_tree().create_tween()
	tw.set_parallel(true)
	tw.tween_property(t, "modulate:a", 0.0, 0.25)
	tw.tween_property(t, "position:y", t.position.y - 5, 0.25)
	tw.chain().tween_callback(t.queue_free)

func _on_area_hit(area: Node) -> void:
	if area.has_method("take_damage"):
		area.take_damage()
		_impact_burst()
		queue_free()

func _impact_burst() -> void:
	for i in range(4):
		var p = ColorRect.new()
		p.size = Vector2(3, 3)
		p.color = Color(0.4, 0.2, 0.5, 0.8)
		p.position = global_position
		p.z_index = 12
		get_parent().add_child(p)
		var dir = Vector2.from_angle(randf() * TAU) * randf_range(10, 25)
		var tw = get_tree().create_tween()
		tw.set_parallel(true)
		tw.tween_property(p, "position", p.position + dir, 0.2)
		tw.tween_property(p, "modulate:a", 0.0, 0.2)
		tw.chain().tween_callback(p.queue_free)
