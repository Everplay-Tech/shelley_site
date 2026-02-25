extends "res://scripts/base_guitar.gd"
## Electric Screamer — zigzag movement, fires sound waves at Po.
## HP 2, speed 160, points 25.

var sound_wave_scene: PackedScene  # Set by spawner
var _zigzag_dir := 1.0
var _zigzag_timer := 0.0
var _attack_timer := 0.0
var _attack_cooldown := 2.5
var _spark_timer := 0.0

func _ready() -> void:
	max_hp = 2
	speed = 160.0
	points = 25
	super._ready()
	_zigzag_timer = randf_range(0.3, 0.6)
	_attack_timer = randf_range(1.0, 2.0)

func _custom_movement(delta: float) -> void:
	# Zigzag vertical movement
	position.y += _zigzag_dir * 80.0 * delta
	_zigzag_timer -= delta
	if _zigzag_timer <= 0.0:
		_zigzag_dir *= -1
		_zigzag_timer = randf_range(0.3, 0.6)

	# Clamp to screen
	position.y = clampf(position.y, 40, 320)

	# Lightning spark particles
	_spark_timer -= delta
	if _spark_timer <= 0.0:
		_spawn_spark()
		_spark_timer = 0.12

func _custom_attack(delta: float) -> void:
	_attack_timer -= delta
	if _attack_timer <= 0.0:
		_fire_sound_wave()
		_attack_timer = _attack_cooldown

func _fire_sound_wave() -> void:
	if not sound_wave_scene:
		return
	var wave = sound_wave_scene.instantiate()
	wave.position = global_position + Vector2(-10, 0)
	get_parent().add_child(wave)
	# Recoil flash
	modulate = Color(0.5, 0.7, 1.0, 1.0)
	var tw = create_tween()
	tw.tween_property(self, "modulate", Color.WHITE, 0.15)

func _spawn_spark() -> void:
	var s = ColorRect.new()
	s.size = Vector2(2, 1)
	s.color = Color(0.6, 0.8, 1.0, 0.7)
	s.position = global_position + Vector2(randf_range(-6, 6), randf_range(-10, 10))
	s.z_index = z_index + 1
	get_parent().add_child(s)
	var tw = get_tree().create_tween()
	tw.tween_property(s, "modulate:a", 0.0, 0.1)
	tw.tween_callback(s.queue_free)
