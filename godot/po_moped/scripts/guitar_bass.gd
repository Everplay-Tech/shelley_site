extends "res://scripts/base_guitar.gd"
## Bass Bomber — slow, heavy, drops note bombs vertically.
## HP 3, speed 80, points 50.

var note_bomb_scene: PackedScene  # Set by spawner
var _bomb_timer := 0.0
var _bomb_cooldown := 2.0
var _rumble_timer := 0.0

func _ready() -> void:
	max_hp = 3
	speed = 80.0
	points = 50
	super._ready()
	_bomb_timer = randf_range(1.0, 1.8)

func _custom_movement(_delta: float) -> void:
	# Slow, steady — slight vertical drift
	position.y += sin(_time * 1.2) * 0.3

	# Dark energy rumble particles
	_rumble_timer -= _delta
	if _rumble_timer <= 0.0:
		_spawn_rumble()
		_rumble_timer = 0.1

func _custom_attack(delta: float) -> void:
	_bomb_timer -= delta
	if _bomb_timer <= 0.0:
		_drop_bomb()
		_bomb_timer = _bomb_cooldown

func _drop_bomb() -> void:
	if not note_bomb_scene:
		return
	var bomb = note_bomb_scene.instantiate()
	bomb.position = global_position + Vector2(0, 10)
	get_parent().add_child(bomb)
	# Heavy drop animation — slight bob up then down
	var tw = create_tween()
	tw.tween_property(self, "position:y", position.y - 3, 0.05)
	tw.tween_property(self, "position:y", position.y + 2, 0.1)
	tw.tween_property(self, "position:y", position.y, 0.05)

func _spawn_rumble() -> void:
	var r = ColorRect.new()
	r.size = Vector2(3, 3)
	r.color = Color(0.3, 0.15, 0.4, 0.5)
	r.position = global_position + Vector2(randf_range(-10, 10), randf_range(-5, 12))
	r.z_index = z_index - 1
	get_parent().add_child(r)
	var tw = get_tree().create_tween()
	tw.set_parallel(true)
	tw.tween_property(r, "modulate:a", 0.0, 0.3)
	tw.tween_property(r, "position:y", r.position.y + 8, 0.3)
	tw.chain().tween_callback(r.queue_free)
