extends Area2D
## Web Glob — Spider web projectile from Spidat's Web Snare attack.
##
## Falls with slow gravity in a fan spread pattern. Each glob trails
## silk thread particles behind it, creating a curtain effect Po must weave through.
##
## VFX: Green-white glow, silk thread trail, wobble rotation,
## impact splat with web-crack pattern.

const WEB_COLOR := Color(0.85, 0.95, 0.85, 0.9)        # Pale green-white
const WEB_GLOW := Color(0.4, 0.9, 0.4, 0.3)            # Green aura
const SILK_COLOR := Color(0.8, 0.85, 0.8, 0.4)          # Faded silk trail
const DAMAGE := 1

## Set by spawner
var vel := Vector2.ZERO
var fall_gravity := 150.0

var _time := 0.0
var _hit := false
var _silk_timer := 0.0

# Visual nodes
var _glob: ColorRect
var _glow: ColorRect

func _ready() -> void:
	collision_layer = 0
	collision_mask = 2  # Po's layer

	# Glob body (white-green ball)
	_glob = ColorRect.new()
	_glob.size = Vector2(8, 8)
	_glob.position = Vector2(-4, -4)
	_glob.color = WEB_COLOR
	_glob.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_glob)

	# Glow aura (larger, transparent)
	_glow = ColorRect.new()
	_glow.size = Vector2(14, 14)
	_glow.position = Vector2(-7, -7)
	_glow.color = WEB_GLOW
	_glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_glow.z_index = -1
	add_child(_glow)

	# Collision
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(10, 10)
	shape.shape = rect
	add_child(shape)

	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	_time += delta

	# Physics
	vel.y += fall_gravity * delta
	# Sine-wave horizontal drift (web floats lazily)
	var drift = sin(_time * 5.0) * 20.0 * delta
	position += vel * delta + Vector2(drift, 0)

	# Wobble rotation (web glob tumbles)
	_glob.rotation = sin(_time * 8.0) * 0.3
	_glow.rotation = _glob.rotation

	# ─── VFX: Pulsing glow ───
	_glow.modulate.a = 0.3 + sin(_time * 12.0) * 0.15

	# ─── VFX: Silk thread trail ───
	_silk_timer -= delta
	if _silk_timer <= 0:
		_silk_timer = 0.04  # Every 40ms
		_spawn_silk_thread()

	# Despawn bounds
	if position.x < -60 or position.x > 700 or position.y > 380 or position.y < -100:
		queue_free()

func _spawn_silk_thread() -> void:
	var thread = ColorRect.new()
	thread.size = Vector2(2, randf_range(6, 14))  # Thin vertical silk strand
	thread.position = Vector2(-1, -thread.size.y / 2.0)
	thread.color = SILK_COLOR
	thread.mouse_filter = Control.MOUSE_FILTER_IGNORE
	thread.global_position = global_position + Vector2(randf_range(-3, 3), randf_range(-3, 3))
	thread.rotation = randf_range(-0.5, 0.5)  # Slight angle variation
	thread.z_index = z_index - 1
	get_parent().add_child(thread)

	# Silk fades + drifts down slightly
	var tween = thread.create_tween()
	tween.tween_property(thread, "modulate:a", 0.0, 0.35)
	tween.parallel().tween_property(thread, "position:y", thread.position.y + 8, 0.35)
	tween.tween_callback(thread.queue_free)

func _on_body_entered(body: Node2D) -> void:
	if _hit:
		return
	if body.has_method("stumble"):
		_hit = true
		body.stumble(DAMAGE)
		_spawn_web_splat()
		queue_free()

func _spawn_web_splat() -> void:
	## Impact burst — web cracks outward like a splat
	for i in range(8):
		var strand = ColorRect.new()
		strand.size = Vector2(2, randf_range(8, 20))
		strand.color = Color(0.9, 1.0, 0.9, 0.7)
		strand.mouse_filter = Control.MOUSE_FILTER_IGNORE
		strand.global_position = global_position
		strand.rotation = TAU * i / 8.0 + randf_range(-0.2, 0.2)
		strand.pivot_offset = Vector2(1, 0)  # Rotate from base
		get_parent().add_child(strand)

		var end_len = strand.size.y * 1.5
		var tween = strand.create_tween()
		tween.tween_property(strand, "size:y", end_len, 0.15).set_ease(Tween.EASE_OUT)
		tween.parallel().tween_property(strand, "modulate:a", 0.0, 0.3)
		tween.tween_callback(strand.queue_free)
