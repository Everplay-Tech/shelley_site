extends "res://scripts/base_guitar.gd"
## Acoustic Ghost — basic enemy. Straight drift with sine bob.
## HP 1, speed 120, points 10.

const BOB_AMPLITUDE := 12.0
const BOB_SPEED := 2.5
var _start_y := 0.0
var _ghost_timer := 0.0

func _ready() -> void:
	max_hp = 1
	speed = 120.0
	points = 10
	super._ready()
	_start_y = position.y

func _custom_movement(_delta: float) -> void:
	# Gentle sine bob — ghostly floating
	position.y = _start_y + sin(_time * BOB_SPEED) * BOB_AMPLITUDE

	# Ghostly shimmer particles
	_ghost_timer -= _delta
	if _ghost_timer <= 0.0:
		_spawn_ghost_wisp()
		_ghost_timer = 0.15

func _spawn_ghost_wisp() -> void:
	var wisp = ColorRect.new()
	wisp.size = Vector2(2, 2)
	wisp.color = Color(0.7, 0.8, 1.0, 0.4)
	wisp.position = global_position + Vector2(randf_range(-8, 8), randf_range(-8, 8))
	wisp.z_index = z_index - 1
	get_parent().add_child(wisp)
	var tw = get_tree().create_tween()
	tw.set_parallel(true)
	tw.tween_property(wisp, "position:y", wisp.position.y - 10, 0.5)
	tw.tween_property(wisp, "modulate:a", 0.0, 0.5)
	tw.chain().tween_callback(wisp.queue_free)
