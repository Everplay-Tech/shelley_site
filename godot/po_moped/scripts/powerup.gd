extends Area2D
## Collectible power-up — drifts left slowly, bobs, glows. Po picks up on contact.

signal collected(type: String)

const DRIFT_SPEED := 40.0
const TYPES := ["spread", "shield", "turbo"]
const TYPE_COLORS := {
	"spread": Color(1.0, 0.6, 0.2, 0.9),   # Orange
	"shield": Color(0.4, 0.9, 0.8, 0.9),    # Cyan
	"turbo": Color(0.3, 0.8, 1.0, 0.9)      # Blue
}

var type := "spread"
var _time := 0.0
var _start_y := 0.0
var _glow_timer := 0.0

func _ready() -> void:
	# Random type if not set externally
	if type == "spread":
		type = TYPES[randi() % TYPES.size()]

	_start_y = position.y

	# Icon
	var icon = ColorRect.new()
	icon.name = "Icon"
	icon.size = Vector2(8, 8)
	icon.position = Vector2(-4, -4)
	icon.color = TYPE_COLORS.get(type, Color.WHITE)
	add_child(icon)

	# Glow border
	var glow = ColorRect.new()
	glow.name = "Glow"
	glow.size = Vector2(12, 12)
	glow.position = Vector2(-6, -6)
	glow.color = Color(TYPE_COLORS.get(type, Color.WHITE), 0.3)
	glow.z_index = -1
	add_child(glow)

	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(10, 10)
	shape.shape = rect
	add_child(shape)

	collision_layer = 0
	collision_mask = 2  # Player
	area_entered.connect(_on_area_hit)

func _process(delta: float) -> void:
	_time += delta
	position.x -= DRIFT_SPEED * delta
	position.y = _start_y + sin(_time * 3.0) * 5.0

	# Pulsing glow
	var glow_node = get_node_or_null("Glow")
	if glow_node:
		glow_node.modulate.a = 0.3 + sin(_time * 5) * 0.2

	# Sparkle particles
	_glow_timer -= delta
	if _glow_timer <= 0.0:
		_spawn_sparkle()
		_glow_timer = 0.12

	if position.x < -30:
		queue_free()

func _spawn_sparkle() -> void:
	var s = ColorRect.new()
	s.size = Vector2(2, 2)
	s.color = Color(1.0, 1.0, 0.8, 0.6)
	s.position = global_position + Vector2(randf_range(-6, 6), randf_range(-6, 6))
	s.z_index = z_index + 1
	get_parent().add_child(s)
	var tw = get_tree().create_tween()
	tw.set_parallel(true)
	tw.tween_property(s, "modulate:a", 0.0, 0.2)
	tw.tween_property(s, "position:y", s.position.y - 5, 0.2)
	tw.chain().tween_callback(s.queue_free)

func _on_area_hit(area: Node) -> void:
	if area.has_method("apply_powerup"):
		area.apply_powerup(type)
		collected.emit(type)
		_collect_burst()
		queue_free()

func _collect_burst() -> void:
	var col = TYPE_COLORS.get(type, Color.WHITE)
	for i in range(6):
		var p = ColorRect.new()
		p.size = Vector2(3, 3)
		p.color = col
		p.position = global_position
		p.z_index = 15
		get_parent().add_child(p)
		var dir = Vector2.from_angle(randf() * TAU) * randf_range(15, 35)
		var tw = get_tree().create_tween()
		tw.set_parallel(true)
		tw.tween_property(p, "position", p.position + dir, 0.3)
		tw.tween_property(p, "modulate:a", 0.0, 0.3)
		tw.chain().tween_callback(p.queue_free)
