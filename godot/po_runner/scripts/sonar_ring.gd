extends Area2D
## Sonar Ring — Bat echolocation projectile from Spidat.
##
## Two modes set by spawner:
##   expanding = true  → Single ring that grows from 20px to 80px tall as it travels
##   expanding = false → Fixed 30px ring (used in triple-ping volleys)
##
## VFX: Purple concentric ring visuals, pulsing alpha, trailing echo rings,
## screen tint during travel. This thing should LOOK like sound.

const SPEED := 300.0
const MAX_RANGE := 280.0
const RING_COLOR := Color(0.6, 0.15, 0.9, 0.85)        # Deep purple
const RING_COLOR_INNER := Color(0.8, 0.4, 1.0, 0.6)    # Light purple inner
const ECHO_COLOR := Color(0.5, 0.1, 0.8, 0.3)          # Faded echo trail
const DAMAGE := 1

## Set by spawner
var expanding := true
var initial_height := 20.0     # Starting ring height (expanding mode)
var max_height := 80.0         # Max ring height (expanding mode)
var fixed_height := 30.0       # Fixed height (ping mode)

var _start_x := 0.0
var _time := 0.0
var _hit := false
var _echo_timer := 0.0

# Visual nodes (created in code — no scene dependencies)
var _outer_ring: ColorRect
var _inner_ring: ColorRect
var _collision: CollisionShape2D
var _shape: RectangleShape2D

func _ready() -> void:
	_start_x = position.x
	collision_layer = 0
	collision_mask = 2  # Po's layer

	# Build visual rings procedurally
	_outer_ring = ColorRect.new()
	_outer_ring.color = RING_COLOR
	_outer_ring.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_outer_ring)

	_inner_ring = ColorRect.new()
	_inner_ring.color = RING_COLOR_INNER
	_inner_ring.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_inner_ring)

	# Collision
	_shape = RectangleShape2D.new()
	_collision = CollisionShape2D.new()
	_collision.shape = _shape
	add_child(_collision)

	# Initial size
	_update_ring_size(initial_height if expanding else fixed_height)

	# Connect damage
	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	_time += delta

	# Travel left
	position.x -= SPEED * delta

	# Calculate progress (0.0 → 1.0)
	var dist = abs(position.x - _start_x)
	var progress = clamp(dist / MAX_RANGE, 0.0, 1.0)

	# Expand ring height over travel distance
	if expanding:
		var current_h = lerp(initial_height, max_height, progress)
		_update_ring_size(current_h)

	# ─── VFX: Pulsing alpha ───
	var pulse = 0.85 + sin(_time * 25.0) * 0.15  # Rapid vibration
	_outer_ring.modulate.a = pulse
	_inner_ring.modulate.a = pulse * 0.7

	# ─── VFX: Echo trail rings ───
	_echo_timer -= delta
	if _echo_timer <= 0:
		_echo_timer = 0.06  # Spawn echo every 60ms
		_spawn_echo_ring()

	# ─── VFX: Slight vertical oscillation (sound wave wobble) ───
	_outer_ring.position.y += sin(_time * 40.0) * 0.3 * delta * 60.0

	# Fade in last 30% of range
	if progress > 0.7:
		var fade = 1.0 - (progress - 0.7) / 0.3
		modulate.a = fade

	# Despawn
	if dist > MAX_RANGE or position.x < -100:
		queue_free()

func _update_ring_size(h: float) -> void:
	var ring_width := 6.0  # Thin ring thickness
	var ring_inner_width := 3.0

	# Outer ring (full height, thin width)
	_outer_ring.size = Vector2(ring_width, h)
	_outer_ring.position = Vector2(-ring_width / 2.0, -h / 2.0)

	# Inner ring (slightly smaller, offset inside)
	var inner_h = h * 0.6
	_inner_ring.size = Vector2(ring_inner_width, inner_h)
	_inner_ring.position = Vector2(-ring_inner_width / 2.0, -inner_h / 2.0)

	# Collision matches outer ring
	_shape.size = Vector2(ring_width + 4, h)
	_collision.position = Vector2.ZERO

func _spawn_echo_ring() -> void:
	var echo = ColorRect.new()
	var h = _outer_ring.size.y
	echo.size = Vector2(4.0, h)
	echo.position = Vector2(-2.0, -h / 2.0)
	echo.color = ECHO_COLOR
	echo.mouse_filter = Control.MOUSE_FILTER_IGNORE
	echo.z_index = z_index - 1
	get_parent().add_child(echo)
	echo.global_position = global_position + echo.position
	echo.position = Vector2.ZERO  # Reset after placing globally

	# Echo fades + expands slightly
	var tween = echo.create_tween()
	tween.tween_property(echo, "modulate:a", 0.0, 0.2)
	tween.parallel().tween_property(echo, "scale:y", 1.3, 0.2)
	tween.tween_callback(echo.queue_free)

func _on_body_entered(body: Node2D) -> void:
	if _hit:
		return
	if body.has_method("stumble"):
		_hit = true
		body.stumble(DAMAGE)
		# ─── VFX: Impact burst — purple flash particles ───
		_spawn_impact_burst()
		# Fade out quickly
		var tween = create_tween()
		tween.tween_property(self, "modulate:a", 0.0, 0.1)
		tween.tween_callback(queue_free)

func _spawn_impact_burst() -> void:
	for i in range(6):
		var particle = ColorRect.new()
		particle.size = Vector2(3, 3)
		particle.color = Color(0.7, 0.3, 1.0, 0.8)
		particle.mouse_filter = Control.MOUSE_FILTER_IGNORE
		particle.global_position = global_position
		get_parent().add_child(particle)

		var angle = TAU * i / 6.0
		var vel = Vector2.from_angle(angle) * randf_range(40, 80)
		var tween = particle.create_tween()
		tween.tween_property(particle, "position", particle.position + vel * 0.3, 0.3)
		tween.parallel().tween_property(particle, "modulate:a", 0.0, 0.3)
		tween.parallel().tween_property(particle, "scale", Vector2(0.2, 0.2), 0.3)
		tween.tween_callback(particle.queue_free)
