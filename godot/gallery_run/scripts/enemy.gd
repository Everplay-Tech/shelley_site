extends Area2D
## Enemy unit — Axis Mundi sea creatures in formation.
## Eye Spawn (baby kraken), Tigerfish (tiger-mermaid), Eye Kraken (eldritch).

signal defeated(enemy: Area2D)
signal attack_fired(enemy: Area2D)

enum EnemyType { EYE_SPAWN, TIGERFISH, EYE_KRAKEN }

const COLORS := {
	EnemyType.EYE_SPAWN: Color(0.2, 0.6, 0.5, 1.0),    # Teal-green
	EnemyType.TIGERFISH: Color(0.85, 0.5, 0.15, 1.0),   # Orange-tiger
	EnemyType.EYE_KRAKEN: Color(0.4, 0.15, 0.5, 1.0),   # Dark purple
}

const HP_TABLE := {
	EnemyType.EYE_SPAWN: 1,
	EnemyType.TIGERFISH: 2,
	EnemyType.EYE_KRAKEN: 3,
}

const POINTS_TABLE := {
	EnemyType.EYE_SPAWN: 10,
	EnemyType.TIGERFISH: 25,
	EnemyType.EYE_KRAKEN: 50,
}

var enemy_type: EnemyType = EnemyType.EYE_SPAWN
var hp := 1
var points := 10
var grid_pos := Vector2i.ZERO  # Position in formation grid
var can_attack := false         # Only front-row enemies attack

var _sprite: Sprite2D
var _placeholder: Node2D
var _attack_timer := 0.0
var _attack_interval := 3.0
var _is_dead := false

# Eye Kraken zigzag
var _zigzag_active := false
var _zigzag_offset := 0.0
var _zigzag_speed := 60.0
var _zigzag_dir := 1.0
var _zigzag_timer := 0.0

# Eye pulse animation
var _eye_pulse_time := 0.0

func setup(type: EnemyType, grid: Vector2i) -> void:
	enemy_type = type
	grid_pos = grid
	hp = HP_TABLE[type]
	points = POINTS_TABLE[type]
	_attack_interval = randf_range(2.5, 4.0)
	_attack_timer = randf_range(0.0, _attack_interval)
	_eye_pulse_time = randf() * TAU  # Random phase offset
	if type == EnemyType.EYE_KRAKEN:
		_zigzag_active = true
		_zigzag_speed = randf_range(40.0, 80.0)

func _ready() -> void:
	# Collision
	var shape := CollisionShape2D.new()
	var rect_shape := RectangleShape2D.new()
	rect_shape.size = Vector2(24, 24)
	shape.shape = rect_shape
	add_child(shape)
	collision_layer = 8   # Enemies
	collision_mask = 4     # Player bullets
	# Try to load sprite
	var type_name: String
	match enemy_type:
		EnemyType.EYE_SPAWN: type_name = "eye_spawn"
		EnemyType.TIGERFISH: type_name = "tigerfish"
		EnemyType.EYE_KRAKEN: type_name = "eye_kraken"
	var tex_path := "res://sprites/enemies/%s.png" % type_name
	if ResourceLoader.exists(tex_path):
		_sprite = Sprite2D.new()
		_sprite.texture = load(tex_path)
		add_child(_sprite)
	else:
		_add_placeholder()
	# Connect bullet detection
	area_entered.connect(_on_area_entered)

func _process(delta: float) -> void:
	if _is_dead:
		return
	# Eye pulse for all types (subtle)
	_eye_pulse_time += delta * 3.0
	# Zigzag for Eye Kraken
	if _zigzag_active:
		_zigzag_timer += delta
		if _zigzag_timer > 0.4:
			_zigzag_timer = 0.0
			_zigzag_dir *= -1.0
		_zigzag_offset += _zigzag_dir * _zigzag_speed * delta
		_zigzag_offset = clampf(_zigzag_offset, -20.0, 20.0)
	# Attack timer (Tigerfish and Eye Kraken can attack)
	if can_attack and (enemy_type == EnemyType.TIGERFISH or enemy_type == EnemyType.EYE_KRAKEN):
		_attack_timer += delta
		if _attack_timer >= _attack_interval:
			_attack_timer = 0.0
			attack_fired.emit(self)

func get_zigzag_offset() -> float:
	return _zigzag_offset

func _on_area_entered(area: Area2D) -> void:
	if _is_dead:
		return
	# Hit by player bullet
	if area.is_in_group("player_bullets"):
		area.queue_free()
		take_hit()

func take_hit() -> void:
	hp -= 1
	if hp <= 0:
		die()
	else:
		_flash_white()

func _flash_white() -> void:
	if _placeholder:
		for child in _placeholder.get_children():
			if child is ColorRect:
				var orig_color: Color = child.color
				child.color = Color.WHITE
				var tween := child.create_tween()
				tween.tween_property(child, "color", orig_color, 0.15)
	elif _sprite:
		_sprite.modulate = Color.WHITE * 2.0
		var tween := _sprite.create_tween()
		tween.tween_property(_sprite, "modulate", Color.WHITE, 0.15)

func die() -> void:
	_is_dead = true
	defeated.emit(self)
	_spawn_death_burst()
	queue_free()

func _spawn_death_burst() -> void:
	var color: Color = COLORS[enemy_type]
	for i in range(6):
		var p := ColorRect.new()
		var s: float = randf_range(2.0, 4.0)
		p.size = Vector2(s, s)
		p.color = Color(color.r, color.g, color.b, 0.8)
		p.position = global_position
		get_parent().add_child(p)
		var angle: float = (TAU / 6.0) * i + randf_range(-0.3, 0.3)
		var dist: float = randf_range(15, 30)
		var target := p.position + Vector2(cos(angle) * dist, sin(angle) * dist)
		var tween := p.create_tween()
		tween.set_parallel(true)
		tween.tween_property(p, "position", target, 0.3)
		tween.tween_property(p, "color:a", 0.0, 0.3)
		tween.chain().tween_callback(p.queue_free)

func _add_placeholder() -> void:
	_placeholder = Node2D.new()
	add_child(_placeholder)
	var color: Color = COLORS[enemy_type]
	match enemy_type:
		EnemyType.EYE_SPAWN:
			_build_eye_spawn(color)
		EnemyType.TIGERFISH:
			_build_tigerfish(color)
		EnemyType.EYE_KRAKEN:
			_build_eye_kraken(color)

func _build_eye_spawn(color: Color) -> void:
	# Round-ish body
	var body := ColorRect.new()
	body.size = Vector2(14, 14)
	body.position = Vector2(-7, -7)
	body.color = color
	_placeholder.add_child(body)
	# Single large eye
	var eye := ColorRect.new()
	eye.size = Vector2(8, 8)
	eye.position = Vector2(-4, -4)
	eye.color = Color.WHITE
	_placeholder.add_child(eye)
	var pupil := ColorRect.new()
	pupil.size = Vector2(4, 4)
	pupil.position = Vector2(-2, -2)
	pupil.color = Color.BLACK
	_placeholder.add_child(pupil)
	# 4 short tentacles
	for i in range(4):
		var tent := ColorRect.new()
		tent.size = Vector2(3, 6)
		var angle: float = (TAU / 4.0) * i + TAU / 8.0
		tent.position = Vector2(cos(angle) * 9 - 1.5, sin(angle) * 9 - 3)
		tent.color = Color(color.r * 0.8, color.g * 0.8, color.b * 0.8)
		_placeholder.add_child(tent)

func _build_tigerfish(color: Color) -> void:
	# Tiger body (front half)
	var body := ColorRect.new()
	body.size = Vector2(20, 16)
	body.position = Vector2(-10, -8)
	body.color = color
	_placeholder.add_child(body)
	# Stripes
	for i in range(3):
		var stripe := ColorRect.new()
		stripe.size = Vector2(3, 12)
		stripe.position = Vector2(-6 + i * 6, -6)
		stripe.color = Color(0.15, 0.08, 0.02)  # Dark stripe
		_placeholder.add_child(stripe)
	# Fish tail
	var tail := ColorRect.new()
	tail.size = Vector2(10, 10)
	tail.position = Vector2(6, -5)
	tail.color = Color(0.3, 0.5, 0.6)  # Scale blue-gray
	_placeholder.add_child(tail)
	# Eyes (fierce)
	for i in range(2):
		var eye := ColorRect.new()
		eye.size = Vector2(4, 3)
		eye.position = Vector2(-8 + i * 8, -5)
		eye.color = Color(1.0, 0.9, 0.2)  # Yellow fierce
		_placeholder.add_child(eye)
	# Fangs
	for i in range(2):
		var fang := ColorRect.new()
		fang.size = Vector2(2, 4)
		fang.position = Vector2(-4 + i * 5, 4)
		fang.color = Color.WHITE
		_placeholder.add_child(fang)

func _build_eye_kraken(color: Color) -> void:
	# Central mass
	var body := ColorRect.new()
	body.size = Vector2(18, 18)
	body.position = Vector2(-9, -9)
	body.color = color
	_placeholder.add_child(body)
	# 3 eyes (clustered)
	var eye_positions := [Vector2(-4, -4), Vector2(2, -4), Vector2(-1, 1)]
	for epos in eye_positions:
		var eye := ColorRect.new()
		eye.size = Vector2(5, 5)
		eye.position = epos
		eye.color = Color(0.9, 0.85, 0.7)  # Pale eye
		_placeholder.add_child(eye)
		var pupil := ColorRect.new()
		pupil.size = Vector2(3, 3)
		pupil.position = epos + Vector2(1, 1)
		pupil.color = Color(0.1, 0.0, 0.15)  # Deep purple pupil
		_placeholder.add_child(pupil)
	# 8 tentacles radiating outward
	for i in range(8):
		var tent := ColorRect.new()
		tent.size = Vector2(3, 7)
		var angle: float = (TAU / 8.0) * i
		tent.position = Vector2(cos(angle) * 11 - 1.5, sin(angle) * 11 - 3.5)
		tent.rotation = angle
		tent.color = Color(color.r * 0.7, color.g * 0.5, color.b * 0.7)
		_placeholder.add_child(tent)
	# Suction cup dots on a few tentacles
	for i in range(4):
		var dot := ColorRect.new()
		dot.size = Vector2(2, 2)
		var angle: float = (TAU / 4.0) * i + 0.3
		dot.position = Vector2(cos(angle) * 14 - 1, sin(angle) * 14 - 1)
		dot.color = Color(0.6, 0.4, 0.7, 0.6)
		_placeholder.add_child(dot)
