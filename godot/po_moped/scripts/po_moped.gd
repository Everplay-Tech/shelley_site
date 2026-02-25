extends Area2D
## Po on moped — 4-directional movement, auto-fire spirit bolts, health, power-ups.
## Constrained to left ~45% of screen (x: 40–300).

signal health_changed(current: int, max_val: int)
signal score_added(points: int)
signal combo_broken
signal died

const SPEED := 180.0
const ACCEL := 800.0
const DECEL := 600.0
const X_MIN := 40.0
const X_MAX := 300.0
const Y_MIN := 30.0
const Y_MAX := 330.0

const MAX_HEALTH := 3
const INVINCIBILITY_TIME := 1.5
const SHOOT_COOLDOWN := 0.18

@export var spirit_bolt_scene: PackedScene

var velocity := Vector2.ZERO
var health := MAX_HEALTH
var invincible := false
var _invincible_timer := 0.0
var _shoot_timer := 0.0
var _shooting := false
var alive := true

# Power-ups
var spread_shot := false
var _spread_timer := 0.0
var ghost_shield := false
var turbo_speed := false
var _turbo_timer := 0.0

# VFX
var _afterimage_timer := 0.0
var _exhaust_timer := 0.0
var _bob_time := 0.0

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var shoot_point: Marker2D = $ShootPoint

func _ready() -> void:
	health_changed.emit(health, MAX_HEALTH)

func _process(delta: float) -> void:
	if not alive:
		return

	_handle_movement(delta)
	_handle_shooting(delta)
	_handle_invincibility(delta)
	_handle_powerup_timers(delta)
	_handle_vfx(delta)

func _handle_movement(delta: float) -> void:
	var input_dir := Vector2.ZERO
	if Input.is_action_pressed("move_left") or Input.is_action_pressed("ui_left"):
		input_dir.x -= 1
	if Input.is_action_pressed("move_right") or Input.is_action_pressed("ui_right"):
		input_dir.x += 1
	if Input.is_action_pressed("move_up") or Input.is_action_pressed("ui_up"):
		input_dir.y -= 1
	if Input.is_action_pressed("move_down") or Input.is_action_pressed("ui_down"):
		input_dir.y += 1

	input_dir = input_dir.normalized()
	var spd = SPEED * (1.5 if turbo_speed else 1.0)

	if input_dir.length() > 0:
		velocity = velocity.move_toward(input_dir * spd, ACCEL * delta)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, DECEL * delta)

	position += velocity * delta
	position.x = clampf(position.x, X_MIN, X_MAX)
	position.y = clampf(position.y, Y_MIN, Y_MAX)

	# Gentle bob while riding
	_bob_time += delta * 3.0
	sprite.offset.y = sin(_bob_time) * 1.5

func _handle_shooting(delta: float) -> void:
	_shoot_timer -= delta
	_shooting = Input.is_action_pressed("shoot") or Input.is_action_pressed("ui_accept")

	if _shooting and _shoot_timer <= 0.0:
		_fire_bolt()
		_shoot_timer = SHOOT_COOLDOWN

func _fire_bolt() -> void:
	if not spirit_bolt_scene:
		return
	if spread_shot:
		# 3-way spread
		for angle in [-12.0, 0.0, 12.0]:
			var bolt = spirit_bolt_scene.instantiate()
			bolt.position = shoot_point.global_position
			bolt.rotation_degrees = angle
			get_parent().add_child(bolt)
	else:
		var bolt = spirit_bolt_scene.instantiate()
		bolt.position = shoot_point.global_position
		get_parent().add_child(bolt)
	# Recoil kick VFX
	_spawn_muzzle_flash()

func _spawn_muzzle_flash() -> void:
	var flash = ColorRect.new()
	flash.size = Vector2(6, 4)
	flash.position = shoot_point.global_position - Vector2(3, 2)
	flash.color = Color(1.0, 0.85, 0.3, 0.9)
	flash.z_index = 10
	get_parent().add_child(flash)
	var tw = get_tree().create_tween()
	tw.tween_property(flash, "modulate:a", 0.0, 0.08)
	tw.tween_property(flash, "scale", Vector2(2.0, 0.5), 0.06)
	tw.tween_callback(flash.queue_free)

func _handle_invincibility(delta: float) -> void:
	if invincible:
		_invincible_timer -= delta
		# Rapid blink
		sprite.modulate.a = 0.3 if fmod(_invincible_timer, 0.12) < 0.06 else 1.0
		if _invincible_timer <= 0.0:
			invincible = false
			sprite.modulate.a = 1.0

func _handle_powerup_timers(delta: float) -> void:
	if spread_shot:
		_spread_timer -= delta
		if _spread_timer <= 0.0:
			spread_shot = false
	if turbo_speed:
		_turbo_timer -= delta
		if _turbo_timer <= 0.0:
			turbo_speed = false

func _handle_vfx(delta: float) -> void:
	# Afterimage trail when moving fast
	_afterimage_timer -= delta
	if velocity.length() > 100 and _afterimage_timer <= 0.0:
		_spawn_afterimage()
		_afterimage_timer = 0.06

	# Exhaust particles from moped
	_exhaust_timer -= delta
	if _exhaust_timer <= 0.0:
		_spawn_exhaust()
		_exhaust_timer = 0.08

func _spawn_afterimage() -> void:
	var ghost = Sprite2D.new()
	ghost.texture = sprite.sprite_frames.get_frame_texture(sprite.animation, sprite.frame)
	ghost.global_position = sprite.global_position
	ghost.modulate = Color(0.3, 0.7, 1.0, 0.4)
	ghost.z_index = -1
	get_parent().add_child(ghost)
	var tw = get_tree().create_tween()
	tw.set_parallel(true)
	tw.tween_property(ghost, "modulate:a", 0.0, 0.3)
	tw.tween_property(ghost, "scale", Vector2(1.1, 0.9), 0.3)
	tw.chain().tween_callback(ghost.queue_free)

func _spawn_exhaust() -> void:
	var puff = ColorRect.new()
	puff.size = Vector2(3, 3)
	puff.color = Color(0.6, 0.6, 0.7, 0.5)
	puff.position = global_position + Vector2(-14, randf_range(-2, 4))
	puff.z_index = -2
	get_parent().add_child(puff)
	var tw = get_tree().create_tween()
	tw.set_parallel(true)
	tw.tween_property(puff, "position:x", puff.position.x - randf_range(15, 25), 0.4)
	tw.tween_property(puff, "modulate:a", 0.0, 0.4)
	tw.tween_property(puff, "scale", Vector2(2.0, 2.0), 0.4)
	tw.chain().tween_callback(puff.queue_free)

# ---- Damage / Power-ups ----

func take_damage() -> void:
	if invincible or not alive:
		return
	if ghost_shield:
		ghost_shield = false
		_flash_shield_break()
		return

	health -= 1
	health_changed.emit(health, MAX_HEALTH)
	invincible = true
	_invincible_timer = INVINCIBILITY_TIME
	_hit_freeze()
	_spawn_hit_particles()

	if health <= 0:
		alive = false
		died.emit()
		_death_sequence()

func _hit_freeze() -> void:
	Engine.time_scale = 0.05
	await get_tree().create_timer(0.04).timeout
	Engine.time_scale = 1.0

func _spawn_hit_particles() -> void:
	for i in range(6):
		var p = ColorRect.new()
		p.size = Vector2(2, 2)
		p.color = Color(1.0, 0.3, 0.2, 0.9)
		p.position = global_position
		p.z_index = 15
		get_parent().add_child(p)
		var dir = Vector2.from_angle(randf() * TAU) * randf_range(30, 60)
		var tw = get_tree().create_tween()
		tw.set_parallel(true)
		tw.tween_property(p, "position", p.position + dir, 0.3)
		tw.tween_property(p, "modulate:a", 0.0, 0.3)
		tw.chain().tween_callback(p.queue_free)

func _flash_shield_break() -> void:
	sprite.modulate = Color(0.5, 1.0, 0.9, 1.0)
	var tw = create_tween()
	tw.tween_property(sprite, "modulate", Color.WHITE, 0.2)
	# Shield shatter particles
	for i in range(8):
		var s = ColorRect.new()
		s.size = Vector2(4, 4)
		s.color = Color(0.4, 0.9, 0.8, 0.8)
		s.position = global_position
		s.z_index = 15
		get_parent().add_child(s)
		var dir = Vector2.from_angle(randf() * TAU) * randf_range(20, 50)
		var stw = get_tree().create_tween()
		stw.set_parallel(true)
		stw.tween_property(s, "position", s.position + dir, 0.4)
		stw.tween_property(s, "modulate:a", 0.0, 0.4)
		stw.tween_property(s, "rotation", randf_range(-2, 2), 0.4)
		stw.chain().tween_callback(s.queue_free)

func _death_sequence() -> void:
	# Dramatic spin + fade
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(sprite, "modulate:a", 0.0, 0.8)
	tw.tween_property(self, "rotation", rotation + PI * 4, 0.8)
	tw.tween_property(self, "position:y", position.y + 80, 0.8)

func apply_powerup(type: String) -> void:
	match type:
		"spread":
			spread_shot = true
			_spread_timer = 10.0
			_flash_powerup(Color(1.0, 0.6, 0.2))
		"shield":
			ghost_shield = true
			_flash_powerup(Color(0.4, 0.9, 0.8))
		"turbo":
			turbo_speed = true
			_turbo_timer = 8.0
			_flash_powerup(Color(0.3, 0.8, 1.0))

func _flash_powerup(col: Color) -> void:
	sprite.modulate = col
	var tw = create_tween()
	tw.tween_property(sprite, "modulate", Color.WHITE, 0.3)

func reset() -> void:
	alive = true
	health = MAX_HEALTH
	invincible = false
	spread_shot = false
	ghost_shield = false
	turbo_speed = false
	velocity = Vector2.ZERO
	position = Vector2(120, 180)
	rotation = 0.0
	sprite.modulate = Color.WHITE
	sprite.modulate.a = 1.0
	health_changed.emit(health, MAX_HEALTH)
