extends Area2D
## Axis Mundi — the player's mythological living ship.
## Moves left/right at the bottom of the screen, fires spirit bolts upward.

signal fire_requested
signal hit_taken

const SPEED := 250.0
const FIRE_COOLDOWN := 0.3

@onready var main: Node2D = get_parent()

var _fire_timer := 0.0
var _invincible := false
var _invincible_timer := 0.0
const INVINCIBLE_DURATION := 1.0
var _blink_timer := 0.0
var _sprite: Sprite2D
var _placeholder: Node2D
var _bob_time := 0.0

# Triple shot power-up
var triple_shot := false
var _triple_timer := 0.0
const TRIPLE_DURATION := 5.0

func _ready() -> void:
	position = Vector2(320, 330)
	# Collision
	var shape := CollisionShape2D.new()
	var rect_shape := RectangleShape2D.new()
	rect_shape.size = Vector2(32, 48)
	shape.shape = rect_shape
	add_child(shape)
	collision_layer = 2   # Player
	collision_mask = 24    # Enemy bullets (16) + Enemies (8)
	# Try to load sprite
	var tex_path := "res://sprites/ship/axis_mundi.png"
	if ResourceLoader.exists(tex_path):
		_sprite = Sprite2D.new()
		_sprite.texture = load(tex_path)
		_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		add_child(_sprite)
	else:
		_add_placeholder()
	# Connect damage detection
	area_entered.connect(_on_area_entered)

func _process(delta: float) -> void:
	# Movement
	var dir := 0.0
	if Input.is_action_pressed("move_left"):
		dir -= 1.0
	if Input.is_action_pressed("move_right"):
		dir += 1.0
	# Touch input: left/right edge zones for movement, center for fire
	if dir == 0.0 and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		var vp := get_viewport()
		if vp:
			var mouse_pos := vp.get_mouse_position()
			if mouse_pos.x < 160.0:
				dir = -1.0
			elif mouse_pos.x > 480.0:
				dir = 1.0
	position.x += dir * SPEED * delta
	position.x = clampf(position.x, 24.0, 616.0)
	# Idle bob
	_bob_time += delta
	var bob_offset: float = sin(_bob_time * 2.0) * 1.5
	if _placeholder:
		_placeholder.position.y = bob_offset
	elif _sprite:
		_sprite.position.y = bob_offset
	# Fire cooldown
	_fire_timer += delta
	if Input.is_action_just_pressed("shoot") or _check_touch_fire():
		if _fire_timer >= FIRE_COOLDOWN:
			_fire_timer = 0.0
			fire_requested.emit()
	# Triple shot timer
	if triple_shot:
		_triple_timer += delta
		if _triple_timer >= TRIPLE_DURATION:
			triple_shot = false
			_triple_timer = 0.0
	# Invincibility
	if _invincible:
		_invincible_timer += delta
		_blink_timer += delta
		# Rapid blink
		var vis: bool = int(_blink_timer * 15.0) % 2 == 0
		if _placeholder:
			_placeholder.visible = vis
		elif _sprite:
			_sprite.visible = vis
		if _invincible_timer >= INVINCIBLE_DURATION:
			_invincible = false
			_invincible_timer = 0.0
			_blink_timer = 0.0
			if _placeholder:
				_placeholder.visible = true
			elif _sprite:
				_sprite.visible = true

func _check_touch_fire() -> bool:
	# Touch fire only on center zone taps (160..480), not edge movement zones
	if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		var vp := get_viewport()
		if vp:
			var mouse_pos := vp.get_mouse_position()
			if mouse_pos.x >= 160.0 and mouse_pos.x <= 480.0:
				return true
	return false

func _on_area_entered(area: Area2D) -> void:
	if _invincible:
		return
	if area.is_in_group("enemy_bullets"):
		area.queue_free()
		take_damage()
	elif area.collision_layer & 8:  # Enemy layer
		take_damage()

func take_damage() -> void:
	if _invincible:
		return
	_invincible = true
	_invincible_timer = 0.0
	_blink_timer = 0.0
	hit_taken.emit()

func activate_triple_shot() -> void:
	triple_shot = true
	_triple_timer = 0.0
	# Flash effect
	if _sprite:
		_sprite.modulate = Color(1.0, 0.85, 0.3, 1.0)
		var tween: Tween = _sprite.create_tween()
		tween.tween_property(_sprite, "modulate", Color.WHITE, 0.3)
	elif _placeholder:
		for child in _placeholder.get_children():
			if child is ColorRect:
				var orig: Color = child.color
				child.color = Color(1.0, 0.85, 0.3, 1.0)
				var tween: Tween = child.create_tween()
				tween.tween_property(child, "color", orig, 0.3)

func _add_placeholder() -> void:
	_placeholder = Node2D.new()
	add_child(_placeholder)
	# Hull (rocky, organic)
	var hull := ColorRect.new()
	hull.size = Vector2(28, 40)
	hull.position = Vector2(-14, -20)
	hull.color = Color(0.35, 0.3, 0.25, 1.0)  # Rocky brown
	_placeholder.add_child(hull)
	# Deck
	var deck := ColorRect.new()
	deck.size = Vector2(22, 16)
	deck.position = Vector2(-11, -12)
	deck.color = Color(0.45, 0.35, 0.2, 1.0)  # Wood
	_placeholder.add_child(deck)
	# Tree canopy at stern (top, since ship faces up)
	var tree := ColorRect.new()
	tree.size = Vector2(20, 12)
	tree.position = Vector2(-10, 8)
	tree.color = Color(0.2, 0.5, 0.2, 0.8)  # Green
	_placeholder.add_child(tree)
	# Wolf head at bow (bottom = front, pointing up on screen)
	var wolf := ColorRect.new()
	wolf.size = Vector2(10, 8)
	wolf.position = Vector2(-5, -24)
	wolf.color = Color(0.5, 0.4, 0.35, 1.0)
	_placeholder.add_child(wolf)
	# Wolf eyes
	for i in range(2):
		var eye := ColorRect.new()
		eye.size = Vector2(2, 2)
		eye.position = Vector2(-3 + i * 4, -22)
		eye.color = Color(1.0, 0.3, 0.1)  # Fiery red
		_placeholder.add_child(eye)
	# Coral accents at bottom (stern)
	for i in range(3):
		var coral := ColorRect.new()
		coral.size = Vector2(4, 3)
		coral.position = Vector2(-8 + i * 6, 16)
		coral.color = Color(0.7, 0.3, 0.4, 0.6)
		_placeholder.add_child(coral)
