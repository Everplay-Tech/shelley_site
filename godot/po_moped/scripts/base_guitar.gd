extends Area2D
## Base class for haunted guitar enemies. Scrolls right→left, takes hits, dies with VFX.
## Subclasses override _custom_movement() and _custom_attack() for unique behavior.

signal defeated(points: int, position: Vector2)
signal dropped_powerup(pos: Vector2)

const LIBERATION_COLOR := Color(1.0, 0.9, 0.5, 0.9)  # Warm golden liberation

@export var max_hp := 1
@export var speed := 120.0
@export var points := 10

var hp: int
var alive := true
var _time := 0.0
var _flash_timer := 0.0

func _ready() -> void:
	hp = max_hp
	collision_layer = 8  # Layer 4 = enemies
	collision_mask = 0
	# Entrance fade
	modulate.a = 0.0
	var tw = create_tween()
	tw.tween_property(self, "modulate:a", 1.0, 0.3)

func _process(delta: float) -> void:
	if not alive:
		return
	_time += delta

	# Base scroll left
	position.x -= speed * delta

	# Subclass-specific movement
	_custom_movement(delta)

	# Subclass-specific attack
	_custom_attack(delta)

	# Flash recovery
	if _flash_timer > 0.0:
		_flash_timer -= delta
		if _flash_timer <= 0.0:
			modulate = Color.WHITE

	# Off-screen cleanup
	if position.x < -60:
		queue_free()

func _custom_movement(_delta: float) -> void:
	pass  # Override in subclass

func _custom_attack(_delta: float) -> void:
	pass  # Override in subclass

func take_hit(damage: int) -> void:
	if not alive:
		return
	hp -= damage
	_flash_hit()
	if hp <= 0:
		_die()

func _flash_hit() -> void:
	modulate = Color(1.0, 0.5, 0.5, 1.0)
	_flash_timer = 0.08

func _die() -> void:
	alive = false
	defeated.emit(points, global_position)

	# 20% chance to drop powerup
	if randf() < 0.20:
		dropped_powerup.emit(global_position)

	# Liberation burst — golden particles radiating outward
	_spawn_liberation_burst()

	# Fade out + scale
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "modulate:a", 0.0, 0.4)
	tw.tween_property(self, "scale", Vector2(1.3, 1.3), 0.4)
	tw.chain().tween_callback(queue_free)

func _spawn_liberation_burst() -> void:
	# Golden notes / music symbols flying outward
	for i in range(8):
		var p = ColorRect.new()
		p.size = Vector2(4, 4)
		p.color = LIBERATION_COLOR
		p.position = global_position
		p.z_index = 15
		get_parent().add_child(p)
		var dir = Vector2.from_angle(randf() * TAU) * randf_range(25, 55)
		var tw = get_tree().create_tween()
		tw.set_parallel(true)
		tw.tween_property(p, "position", p.position + dir, 0.5)
		tw.tween_property(p, "modulate:a", 0.0, 0.5)
		tw.tween_property(p, "rotation", randf_range(-3, 3), 0.5)
		tw.chain().tween_callback(p.queue_free)

	# Central flash
	var flash = ColorRect.new()
	flash.size = Vector2(16, 16)
	flash.position = global_position - Vector2(8, 8)
	flash.color = Color(1.0, 1.0, 0.8, 0.7)
	flash.z_index = 14
	get_parent().add_child(flash)
	var ftw = get_tree().create_tween()
	ftw.set_parallel(true)
	ftw.tween_property(flash, "modulate:a", 0.0, 0.3)
	ftw.tween_property(flash, "scale", Vector2(3.0, 3.0), 0.3)
	ftw.chain().tween_callback(flash.queue_free)
