extends Area2D
## Po's spirit bolt — travels upper-right, amber energy.
## VFX: pulsing glow, particle trail, impact burst on hit.

const SPEED := 350.0
const MAX_RANGE := 700.0
const BOLT_COLOR := Color(1.0, 0.75, 0.15, 0.95)  # Amber energy
const TRAIL_COLOR := Color(1.0, 0.6, 0.1, 0.5)

var _traveled := 0.0
var _trail_timer := 0.0
var _pulse_time := 0.0

func _ready() -> void:
	# Build visual — elongated amber bolt
	var bolt_body = ColorRect.new()
	bolt_body.name = "Body"
	bolt_body.size = Vector2(8, 3)
	bolt_body.position = Vector2(-4, -1.5)
	bolt_body.color = BOLT_COLOR
	add_child(bolt_body)

	# Core glow (brighter center)
	var core = ColorRect.new()
	core.name = "Core"
	core.size = Vector2(4, 1)
	core.position = Vector2(-2, -0.5)
	core.color = Color(1.0, 1.0, 0.8, 1.0)
	add_child(core)

	# Collision
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(8, 4)
	shape.shape = rect
	add_child(shape)

	# Layer config — hits enemies (layer 4)
	collision_layer = 0
	collision_mask = 8  # Layer 4 = enemies

	body_entered.connect(_on_hit)
	area_entered.connect(_on_area_hit)

func _process(delta: float) -> void:
	var dir = Vector2.RIGHT.rotated(rotation)
	var move = dir * SPEED * delta
	position += move
	_traveled += move.length()

	# Pulsing glow
	_pulse_time += delta * 12.0
	var pulse = 0.8 + sin(_pulse_time) * 0.2
	modulate.a = pulse

	# Trail particles
	_trail_timer -= delta
	if _trail_timer <= 0.0:
		_spawn_trail()
		_trail_timer = 0.03

	# Range limit
	if _traveled > MAX_RANGE or position.x > 700 or position.x < -50:
		queue_free()

func _spawn_trail() -> void:
	var p = ColorRect.new()
	p.size = Vector2(3, 2)
	p.color = TRAIL_COLOR
	p.position = global_position + Vector2(randf_range(-2, 0), randf_range(-2, 2))
	p.z_index = z_index - 1
	get_parent().add_child(p)
	var tw = get_tree().create_tween()
	tw.set_parallel(true)
	tw.tween_property(p, "modulate:a", 0.0, 0.2)
	tw.tween_property(p, "scale", Vector2(0.3, 0.3), 0.2)
	tw.chain().tween_callback(p.queue_free)

func _on_hit(_body: Node) -> void:
	_impact_burst()
	queue_free()

func _on_area_hit(area: Node) -> void:
	if area.has_method("take_hit"):
		area.take_hit(1)
		_impact_burst()
		queue_free()

func _impact_burst() -> void:
	# Amber star burst on impact
	for i in range(5):
		var p = ColorRect.new()
		p.size = Vector2(3, 3)
		p.color = Color(1.0, 0.85, 0.3, 0.9)
		p.position = global_position
		p.z_index = 12
		get_parent().add_child(p)
		var dir = Vector2.from_angle(randf() * TAU) * randf_range(15, 40)
		var tw = get_tree().create_tween()
		tw.set_parallel(true)
		tw.tween_property(p, "position", p.position + dir, 0.25)
		tw.tween_property(p, "modulate:a", 0.0, 0.25)
		tw.chain().tween_callback(p.queue_free)
