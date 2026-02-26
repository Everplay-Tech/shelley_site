extends Area2D
## Spirit Fist — spectral energy projectile fired during NG+ attack.
## Travels rightward, hits first enemy, one-shot destroy.
## Spectral blue-white trail particles every 0.03s.

const SPEED := 350.0
const MAX_RANGE := 700.0
const TRAIL_INTERVAL := 0.03
const TRAIL_COLOR := Color(0.5, 0.8, 1.0, 0.45)
const IMPACT_COLOR := Color(0.7, 0.9, 1.0, 0.8)

var _distance_traveled := 0.0
var _trail_timer := 0.0
var scroll_speed := 0.0  # Set by main.gd, allows world_scrollable grouping

func _ready() -> void:
	add_to_group("world_scrollable")
	# Visual — spectral energy fist (ColorRect placeholder until sprites arrive)
	var visual = ColorRect.new()
	visual.size = Vector2(8, 6)
	visual.color = Color(0.6, 0.85, 1.0, 0.85)
	visual.position = Vector2(-4, -3)
	add_child(visual)
	# Glow halo
	var glow = ColorRect.new()
	glow.size = Vector2(12, 10)
	glow.color = Color(0.5, 0.75, 1.0, 0.2)
	glow.position = Vector2(-6, -5)
	add_child(glow)
	# Collision shape
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(8, 6)
	shape.shape = rect
	add_child(shape)
	# Connect hit detection
	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)

func _process(delta: float) -> void:
	# Move rightward (world scrolls left, projectile moves right)
	var move_speed = SPEED - scroll_speed
	position.x += move_speed * delta
	_distance_traveled += SPEED * delta
	# Trail particles
	_trail_timer -= delta
	if _trail_timer <= 0:
		_trail_timer = TRAIL_INTERVAL
		_spawn_trail()
	# Max range — fizzle out
	if _distance_traveled >= MAX_RANGE:
		_fizzle()

func _spawn_trail() -> void:
	var p = ColorRect.new()
	var size = randf_range(1.5, 3.0)
	p.size = Vector2(size, size)
	p.color = TRAIL_COLOR
	p.global_position = global_position + Vector2(randf_range(-3, 3), randf_range(-3, 3))
	p.z_index = z_index - 1
	get_parent().add_child(p)
	var tween = p.create_tween()
	tween.set_parallel(true)
	tween.tween_property(p, "modulate:a", 0.0, 0.15)
	tween.tween_property(p, "size", Vector2(0.5, 0.5), 0.15)
	tween.set_parallel(false)
	tween.tween_callback(p.queue_free)

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("enemies"):
		_impact(body)

func _on_area_entered(area: Area2D) -> void:
	if area.is_in_group("enemies"):
		_impact(area)

func _impact(target: Node) -> void:
	# Hit the enemy
	if target.has_method("take_hit"):
		target.take_hit()
	elif target.has_method("defeat"):
		target.defeat()
	# Impact burst
	_spawn_impact_burst()
	queue_free()

func _spawn_impact_burst() -> void:
	for i in range(5):
		var p = ColorRect.new()
		var size = randf_range(2.0, 4.0)
		p.size = Vector2(size, size)
		p.color = IMPACT_COLOR
		p.global_position = global_position + Vector2(randf_range(-5, 5), randf_range(-5, 5))
		p.z_index = z_index + 1
		get_parent().add_child(p)
		var dir = Vector2(randf_range(-40, 40), randf_range(-40, 40))
		var tween = p.create_tween()
		tween.set_parallel(true)
		tween.tween_property(p, "global_position", p.global_position + dir * 0.2, 0.2)
		tween.tween_property(p, "modulate:a", 0.0, 0.2)
		tween.set_parallel(false)
		tween.tween_callback(p.queue_free)

func _fizzle() -> void:
	# Gentle fade-out at max range
	_spawn_impact_burst()
	queue_free()
