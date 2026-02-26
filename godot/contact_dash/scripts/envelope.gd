extends Area2D
## Falling envelope — catch for points, miss for penalty.
## Magnet envelopes grant 3s auto-catch radius.

signal caught(envelope: Area2D)
signal missed(envelope: Area2D)

var fall_speed := 150.0
var is_magnet := false
var _caught := false

func _ready() -> void:
	# Try loading PixelLab envelope sprites (32x32 pixel art)
	var sprite_path: String = "res://sprites/envelope/magnet.png" if is_magnet else "res://sprites/envelope/normal.png"
	var tex: Texture2D = null
	if ResourceLoader.exists(sprite_path):
		tex = load(sprite_path) as Texture2D

	if tex:
		# Sprite loaded — use it instead of ColorRect placeholders
		var sprite := Sprite2D.new()
		sprite.texture = tex
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		# Scale 32x32 sprite to match original placeholder sizes
		# Normal envelope was 12x8 → scale ~0.375 x 0.25, average to uniform ~0.34
		# Magnet envelope was 14x10 → scale ~0.4375 x 0.3125, average to uniform ~0.38
		if is_magnet:
			sprite.scale = Vector2(14.0 / 32.0, 10.0 / 32.0)
		else:
			sprite.scale = Vector2(12.0 / 32.0, 8.0 / 32.0)
		add_child(sprite)
	else:
		# Fallback — ColorRect placeholders (no sprite found)
		var body = ColorRect.new()
		if is_magnet:
			body.size = Vector2(14, 10)
			body.color = Color(0.6, 0.3, 0.8, 0.9)  # Purple magnet
			body.position = Vector2(-7, -5)
		else:
			# Random envelope color variants
			var colors = [
				Color(0.95, 0.85, 0.6, 1.0),   # Cream
				Color(0.85, 0.75, 0.55, 1.0),   # Parchment
				Color(0.9, 0.9, 0.8, 1.0),      # Off-white
				Color(0.8, 0.7, 0.5, 1.0),      # Kraft
			]
			body.size = Vector2(12, 8)
			body.color = colors[randi() % colors.size()]
			body.position = Vector2(-6, -4)
		add_child(body)

		# Seal/flap accent
		var seal = ColorRect.new()
		if is_magnet:
			seal.size = Vector2(6, 3)
			seal.color = Color(0.8, 0.4, 1.0, 0.8)  # Bright purple
			seal.position = Vector2(-3, -5)
		else:
			seal.size = Vector2(5, 3)
			seal.color = Color(0.8, 0.2, 0.2, 0.7)  # Red wax seal
			seal.position = Vector2(-2.5, -4)
		add_child(seal)

	# Collision shape
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(12, 8)
	shape.shape = rect
	add_child(shape)

func _process(delta: float) -> void:
	if _caught:
		return
	position.y += fall_speed * delta

	# Slight stretch as envelope accelerates (Sly Cooper weight feel)
	var stretch: float = clampf(fall_speed / 250.0, 0.0, 1.0)
	scale.x = lerpf(1.0, 0.9, stretch)
	scale.y = lerpf(1.0, 1.15, stretch)

	# Slight horizontal drift for visual interest
	position.x += sin(position.y * 0.05) * 0.3

	# Missed — fell below viewport
	if position.y > 370:
		missed.emit(self)
		queue_free()

func catch_it() -> void:
	if _caught:
		return
	_caught = true
	caught.emit(self)
	_spawn_catch_vfx()

func _spawn_catch_vfx() -> void:
	# Overbright flash at envelope position
	var flash := ColorRect.new()
	flash.size = Vector2(16, 16)
	flash.color = Color(3.0, 2.5, 1.0, 0.8)
	flash.global_position = global_position + Vector2(-8, -8)
	flash.z_index = 10
	get_parent().add_child(flash)
	var flash_tw: Tween = flash.create_tween()
	flash_tw.set_parallel(true)
	flash_tw.tween_property(flash, "modulate:a", 0.0, 0.1)
	flash_tw.tween_property(flash, "scale", Vector2(2.0, 2.0), 0.1)
	flash_tw.chain().tween_callback(flash.queue_free)

	# Amber burst particles
	for i in range(4):
		var p = ColorRect.new()
		var size: float = randf_range(2.0, 4.0)
		p.size = Vector2(size, size)
		p.color = Color(1.0, 0.75, 0.0, 0.8)  # Amber
		p.global_position = global_position + Vector2(randf_range(-6, 6), randf_range(-6, 6))
		get_parent().add_child(p)
		var dir = Vector2(randf_range(-30, 30), randf_range(-50, -10))
		var tween: Tween = p.create_tween()
		tween.set_parallel(true)
		tween.tween_property(p, "global_position", p.global_position + dir * 0.3, 0.3)
		tween.tween_property(p, "modulate:a", 0.0, 0.3)
		tween.set_parallel(false)
		tween.tween_callback(p.queue_free)

	# Floating "+1" label
	var lbl = Label.new()
	lbl.text = "+1"
	lbl.add_theme_font_size_override("font_size", 10)
	lbl.add_theme_color_override("font_color", Color(1.0, 0.75, 0.0, 1.0))
	lbl.global_position = global_position + Vector2(-6, -12)
	get_parent().add_child(lbl)
	var tween: Tween = lbl.create_tween()
	tween.set_parallel(true)
	tween.tween_property(lbl, "global_position:y", lbl.global_position.y - 20, 0.5)
	tween.tween_property(lbl, "modulate:a", 0.0, 0.5)
	tween.set_parallel(false)
	tween.tween_callback(lbl.queue_free)

	queue_free()
