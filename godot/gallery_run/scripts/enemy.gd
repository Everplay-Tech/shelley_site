extends Area2D
## Enemy unit — sits in formation, can attack, can be destroyed.

signal defeated(enemy: Area2D)
signal attack_fired(enemy: Area2D)

enum EnemyType { FRAME, WRAITH, CRITIC }

const COLORS := {
	EnemyType.FRAME: Color(0.6, 0.5, 0.3, 1.0),    # Gold frame
	EnemyType.WRAITH: Color(0.5, 0.2, 0.7, 1.0),    # Purple paint
	EnemyType.CRITIC: Color(0.8, 0.2, 0.2, 1.0),     # Red formal
}

const HP_TABLE := {
	EnemyType.FRAME: 1,
	EnemyType.WRAITH: 2,
	EnemyType.CRITIC: 3,
}

const POINTS_TABLE := {
	EnemyType.FRAME: 10,
	EnemyType.WRAITH: 25,
	EnemyType.CRITIC: 50,
}

var enemy_type: EnemyType = EnemyType.FRAME
var hp := 1
var points := 10
var grid_pos := Vector2i.ZERO  # Position in formation grid
var can_attack := false         # Only front-row enemies attack

var _sprite: Sprite2D
var _placeholder: Node2D
var _attack_timer := 0.0
var _attack_interval := 3.0
var _is_dead := false

# Critic zigzag
var _zigzag_active := false
var _zigzag_offset := 0.0
var _zigzag_speed := 60.0
var _zigzag_dir := 1.0
var _zigzag_timer := 0.0

func setup(type: EnemyType, grid: Vector2i) -> void:
	enemy_type = type
	grid_pos = grid
	hp = HP_TABLE[type]
	points = POINTS_TABLE[type]
	_attack_interval = randf_range(2.5, 4.0)
	_attack_timer = randf_range(0.0, _attack_interval)
	if type == EnemyType.CRITIC:
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
		EnemyType.FRAME: type_name = "frame"
		EnemyType.WRAITH: type_name = "wraith"
		EnemyType.CRITIC: type_name = "critic"
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
	# Zigzag for critics
	if _zigzag_active:
		_zigzag_timer += delta
		if _zigzag_timer > 0.4:
			_zigzag_timer = 0.0
			_zigzag_dir *= -1.0
		_zigzag_offset += _zigzag_dir * _zigzag_speed * delta
		_zigzag_offset = clampf(_zigzag_offset, -20.0, 20.0)
	# Attack timer (only front row enemies with attack ability)
	if can_attack and (enemy_type == EnemyType.WRAITH or enemy_type == EnemyType.CRITIC):
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
		area.queue_free()  # Destroy the bullet
		take_hit()

func take_hit() -> void:
	hp -= 1
	if hp <= 0:
		die()
	else:
		# Flash white on hit
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
	# Death VFX: burst particles
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
	# Body
	var body := ColorRect.new()
	body.size = Vector2(20, 20)
	body.position = Vector2(-10, -10)
	body.color = color
	_placeholder.add_child(body)
	# Eyes
	for i in range(2):
		var eye := ColorRect.new()
		eye.size = Vector2(4, 4)
		eye.position = Vector2(-6 + i * 8, -4)
		eye.color = Color.WHITE
		_placeholder.add_child(eye)
		var pupil := ColorRect.new()
		pupil.size = Vector2(2, 2)
		pupil.position = Vector2(-5 + i * 8, -3)
		pupil.color = Color.BLACK
		_placeholder.add_child(pupil)
	# Type indicator
	match enemy_type:
		EnemyType.FRAME:
			# Frame border
			var border := ColorRect.new()
			border.size = Vector2(24, 24)
			border.position = Vector2(-12, -12)
			border.color = Color(color.r, color.g, color.b, 0.3)
			_placeholder.add_child(border)
			border.z_index = -1
		EnemyType.WRAITH:
			# Swirl accent
			var accent := ColorRect.new()
			accent.size = Vector2(6, 3)
			accent.position = Vector2(-3, 6)
			accent.color = Color(0.3, 0.8, 0.2)  # Green paint
			_placeholder.add_child(accent)
		EnemyType.CRITIC:
			# Top hat
			var hat := ColorRect.new()
			hat.size = Vector2(10, 5)
			hat.position = Vector2(-5, -15)
			hat.color = Color(0.15, 0.15, 0.15)
			_placeholder.add_child(hat)
