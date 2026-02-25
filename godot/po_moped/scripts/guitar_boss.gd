extends "res://scripts/base_guitar.gd"
## The Flying V (Boss) — multi-phase, spread fire patterns.
## HP 10, speed 60, points 200.

signal boss_defeated

var sound_wave_scene: PackedScene  # Set by spawner

enum Phase { ENTER, ATTACK_SWEEP, ATTACK_SPREAD, ATTACK_BARRAGE, VULNERABLE, FLEE }
var phase := Phase.ENTER
var _phase_timer := 0.0
var _attack_count := 0
var _target_y := 180.0
var _fire_timer := 0.0
var _flame_timer := 0.0
var _entered := false

func _ready() -> void:
	max_hp = 10
	speed = 60.0
	points = 200
	super._ready()
	_target_y = 180.0

func _custom_movement(_delta: float) -> void:
	match phase:
		Phase.ENTER:
			# Fly in from right, stop at x=500
			if position.x <= 500:
				speed = 0
				_entered = true
				_enter_phase(Phase.ATTACK_SWEEP)
		Phase.ATTACK_SWEEP:
			# Sweep up and down
			position.y = move_toward(position.y, _target_y, 100 * _delta)
			if absf(position.y - _target_y) < 2:
				_target_y = 180.0 + sin(_time * 1.5) * 120.0
		Phase.ATTACK_SPREAD, Phase.ATTACK_BARRAGE:
			# Hover with slight bob
			position.y = 180.0 + sin(_time * 2.0) * 30.0
		Phase.VULNERABLE:
			# Stunned — slight shake
			position.x += sin(_time * 20) * 0.5
		Phase.FLEE:
			# Fly away right
			speed = -200  # Negative = move right
			position.x -= speed * _delta

func _custom_attack(delta: float) -> void:
	if not _entered:
		return

	_phase_timer -= delta

	# Fire wing particles (always)
	_flame_timer -= delta
	if _flame_timer <= 0.0:
		_spawn_wing_flame()
		_flame_timer = 0.06

	match phase:
		Phase.ATTACK_SWEEP:
			_fire_timer -= delta
			if _fire_timer <= 0.0:
				_fire_single_wave()
				_fire_timer = 0.6
				_attack_count += 1
				if _attack_count >= 5:
					_enter_phase(Phase.ATTACK_SPREAD)
		Phase.ATTACK_SPREAD:
			_fire_timer -= delta
			if _fire_timer <= 0.0:
				_fire_spread()
				_fire_timer = 1.2
				_attack_count += 1
				if _attack_count >= 3:
					_enter_phase(Phase.ATTACK_BARRAGE)
		Phase.ATTACK_BARRAGE:
			_fire_timer -= delta
			if _fire_timer <= 0.0:
				_fire_barrage()
				_fire_timer = 0.3
				_attack_count += 1
				if _attack_count >= 8:
					_enter_phase(Phase.VULNERABLE)
		Phase.VULNERABLE:
			if _phase_timer <= 0.0:
				_enter_phase(Phase.ATTACK_SWEEP)

func _enter_phase(new_phase: Phase) -> void:
	phase = new_phase
	_attack_count = 0
	_fire_timer = 0.5  # Brief pause before attacking
	match new_phase:
		Phase.VULNERABLE:
			_phase_timer = 3.0
			modulate = Color(1.0, 0.6, 0.6, 1.0)
			# Stun flash
			var tw = create_tween()
			tw.tween_property(self, "modulate", Color(1.0, 0.8, 0.8, 1.0), 0.3)
		Phase.ATTACK_SWEEP:
			modulate = Color.WHITE
		Phase.ATTACK_SPREAD:
			# Red flash telegraph
			modulate = Color(1.0, 0.4, 0.2, 1.0)
			var tw = create_tween()
			tw.tween_property(self, "modulate", Color.WHITE, 0.3)
		Phase.ATTACK_BARRAGE:
			# Purple flash
			modulate = Color(0.8, 0.3, 1.0, 1.0)
			var tw = create_tween()
			tw.tween_property(self, "modulate", Color.WHITE, 0.3)

func _fire_single_wave() -> void:
	if not sound_wave_scene:
		return
	var wave = sound_wave_scene.instantiate()
	wave.position = global_position + Vector2(-20, 0)
	wave.speed_mult = 1.3
	get_parent().add_child(wave)

func _fire_spread() -> void:
	if not sound_wave_scene:
		return
	for angle in [-20.0, -10.0, 0.0, 10.0, 20.0]:
		var wave = sound_wave_scene.instantiate()
		wave.position = global_position + Vector2(-20, 0)
		wave.rotation_degrees = 180 + angle  # Fire left with spread
		get_parent().add_child(wave)

func _fire_barrage() -> void:
	if not sound_wave_scene:
		return
	var wave = sound_wave_scene.instantiate()
	wave.position = global_position + Vector2(-20, randf_range(-10, 10))
	wave.speed_mult = 1.5
	get_parent().add_child(wave)

func _die() -> void:
	alive = false
	boss_defeated.emit()
	defeated.emit(points, global_position)

	# Epic liberation — massive golden explosion
	for i in range(16):
		var p = ColorRect.new()
		p.size = Vector2(6, 6)
		p.color = Color(1.0, 0.85, 0.3, 0.9)
		p.position = global_position
		p.z_index = 20
		get_parent().add_child(p)
		var dir = Vector2.from_angle((float(i) / 16.0) * TAU) * randf_range(40, 80)
		var tw = get_tree().create_tween()
		tw.set_parallel(true)
		tw.tween_property(p, "position", p.position + dir, 0.6)
		tw.tween_property(p, "modulate:a", 0.0, 0.6)
		tw.tween_property(p, "rotation", randf_range(-4, 4), 0.6)
		tw.chain().tween_callback(p.queue_free)

	# Screen flash
	var flash = ColorRect.new()
	flash.size = Vector2(640, 360)
	flash.position = Vector2.ZERO
	flash.color = Color(1.0, 1.0, 0.8, 0.5)
	flash.z_index = 50
	get_parent().add_child(flash)
	var ftw = get_tree().create_tween()
	ftw.tween_property(flash, "modulate:a", 0.0, 0.5)
	ftw.tween_callback(flash.queue_free)

	# Fade out
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "modulate:a", 0.0, 0.6)
	tw.tween_property(self, "scale", Vector2(1.5, 1.5), 0.6)
	tw.chain().tween_callback(queue_free)

func _spawn_wing_flame() -> void:
	var f = ColorRect.new()
	f.size = Vector2(4, 3)
	f.color = Color(1.0, 0.4, 0.1, 0.6) if randf() > 0.5 else Color(1.0, 0.7, 0.2, 0.5)
	f.position = global_position + Vector2(randf_range(-12, 12), randf_range(-15, 5))
	f.z_index = z_index - 1
	get_parent().add_child(f)
	var tw = get_tree().create_tween()
	tw.set_parallel(true)
	tw.tween_property(f, "position:y", f.position.y - randf_range(8, 15), 0.25)
	tw.tween_property(f, "modulate:a", 0.0, 0.25)
	tw.chain().tween_callback(f.queue_free)
