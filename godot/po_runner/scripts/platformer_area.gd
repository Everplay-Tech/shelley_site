extends Node2D
## Post-morph platformer area — "The Clearing"
## Built procedurally: platforms, collectible orbs, and a glowing door.
## Instanced by main.gd when all 6 artifact pieces are collected.
## This is the victory lap — proof that Po can now move freely.

signal orb_collected(count: int, total: int)
signal door_reached

const PLATFORM_COLOR := Color(0.25, 0.2, 0.15, 1.0)       # Dark wood brown
const PLATFORM_TOP := Color(0.4, 0.35, 0.22, 1.0)          # Lighter top edge
const ORB_COLOR := Color(1.0, 0.75, 0.0, 0.85)             # Golden amber
const ORB_GLOW := Color(1.0, 0.75, 0.0, 0.12)              # Soft glow
const DOOR_FRAME_COLOR := Color(1.0, 0.75, 0.0, 0.6)       # Glowing amber
const DOOR_INNER_COLOR := Color(1.0, 0.85, 0.3, 0.35)      # Inner glow
const GROUND_COLOR := Color(0.18, 0.15, 0.1, 1.0)          # Dark earth

var _orbs_collected := 0
var _total_orbs := 0
var _door_active := true
var _orb_nodes: Array[Area2D] = []
var _orb_base_y: Array[float] = []  # For bobbing animation
var _door_node: Area2D = null

func _ready() -> void:
	_build_ground_extension()
	_build_platforms()
	_build_orbs()
	_build_door()

# ============================================================
# GROUND — Extends the runner floor into the platformer zone
# ============================================================

func _build_ground_extension() -> void:
	# Extend floor from x=-400 to x=1600 (covers left exploration + right path)
	# The runner's existing floor covers roughly x=-680 to x=1320,
	# so this adds coverage for the far-right door area
	var ground_body = StaticBody2D.new()
	ground_body.position = Vector2(600, 318)
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(2400, 20)
	shape.shape = rect
	ground_body.add_child(shape)
	# Visual ground strip
	var visual = ColorRect.new()
	visual.size = Vector2(2400, 40)
	visual.position = Vector2(-1200, -10)
	visual.color = GROUND_COLOR
	visual.z_index = -1
	ground_body.add_child(visual)
	add_child(ground_body)

# ============================================================
# PLATFORMS — Ascending paths for exploration
# ============================================================

func _create_platform(pos: Vector2, width: float, height: float = 12.0) -> void:
	var platform = StaticBody2D.new()
	platform.position = pos
	# Collision
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(width, height)
	shape.shape = rect
	platform.add_child(shape)
	# Main body visual
	var body = ColorRect.new()
	body.size = Vector2(width, height)
	body.position = Vector2(-width / 2.0, -height / 2.0)
	body.color = PLATFORM_COLOR
	platform.add_child(body)
	# Top highlight — 2px bright strip
	var top_strip = ColorRect.new()
	top_strip.size = Vector2(width, 2)
	top_strip.position = Vector2(-width / 2.0, -height / 2.0)
	top_strip.color = PLATFORM_TOP
	platform.add_child(top_strip)
	# Side shadow — 2px dark strip on right
	var side_shadow = ColorRect.new()
	side_shadow.size = Vector2(2, height)
	side_shadow.position = Vector2(width / 2.0 - 2, -height / 2.0)
	side_shadow.color = Color(0.12, 0.1, 0.07, 0.6)
	platform.add_child(side_shadow)
	add_child(platform)

func _build_platforms() -> void:
	# Ground level is y=308 (Po's feet on the floor at y=318)
	# Platforms ascending right from Po's starting position (x=100)

	# Right path — ascending platforms
	_create_platform(Vector2(300, 278), 90)     # Low step
	_create_platform(Vector2(480, 248), 80)     # Mid step
	_create_platform(Vector2(650, 218), 90)     # High step

	# Right continuation — path to door
	_create_platform(Vector2(820, 248), 100)    # Dip back down
	_create_platform(Vector2(980, 218), 90)     # Back up
	_create_platform(Vector2(1140, 190), 130)   # Door platform (wide)

	# Left exploration — hidden alcove path (going left from x=100)
	_create_platform(Vector2(-50, 282), 70)     # Small step left
	_create_platform(Vector2(-180, 296), 90)    # Hidden alcove (near ground)

# ============================================================
# ORBS — Collectible breadcrumbs (golden amber)
# ============================================================

func _create_orb(pos: Vector2) -> void:
	var orb = Area2D.new()
	orb.position = pos
	orb.collision_layer = 0
	orb.collision_mask = 1  # Detect bodies on layer 1 (Po)
	# Collision shape
	var shape = CollisionShape2D.new()
	var circle = CircleShape2D.new()
	circle.radius = 7.0
	shape.shape = circle
	orb.add_child(shape)
	# Core visual — small golden square
	var core = ColorRect.new()
	core.size = Vector2(6, 6)
	core.position = Vector2(-3, -3)
	core.color = ORB_COLOR
	core.z_index = 8
	orb.add_child(core)
	# Glow halo
	var glow = ColorRect.new()
	glow.size = Vector2(12, 12)
	glow.position = Vector2(-6, -6)
	glow.color = ORB_GLOW
	glow.z_index = 7
	orb.add_child(glow)
	orb.body_entered.connect(_on_orb_touched.bind(orb))
	add_child(orb)
	_orb_nodes.append(orb)
	_orb_base_y.append(pos.y)
	_total_orbs += 1

func _build_orbs() -> void:
	# Breadcrumb trail across platforms + ground
	_create_orb(Vector2(200, 292))    # Ground level, leading right
	_create_orb(Vector2(300, 262))    # On first platform
	_create_orb(Vector2(480, 232))    # On second platform
	_create_orb(Vector2(650, 202))    # On third platform
	_create_orb(Vector2(820, 232))    # On right path
	_create_orb(Vector2(980, 202))    # On right path cont.
	_create_orb(Vector2(1100, 174))   # Near door
	_create_orb(Vector2(-180, 278))   # Hidden alcove reward

# ============================================================
# DOOR — Glowing amber portal at the end
# ============================================================

func _build_door() -> void:
	var door = Area2D.new()
	door.name = "Door"
	door.position = Vector2(1160, 165)  # On the door platform
	door.collision_layer = 0
	door.collision_mask = 1  # Detect Po
	# Collision
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(22, 40)
	shape.shape = rect
	door.add_child(shape)
	# Door frame — outer glow
	var frame = ColorRect.new()
	frame.size = Vector2(22, 40)
	frame.position = Vector2(-11, -20)
	frame.color = DOOR_FRAME_COLOR
	frame.z_index = 8
	door.add_child(frame)
	# Inner bright area
	var inner = ColorRect.new()
	inner.size = Vector2(16, 34)
	inner.position = Vector2(-8, -17)
	inner.color = DOOR_INNER_COLOR
	inner.z_index = 9
	door.add_child(inner)
	# Top arch — small accent
	var arch = ColorRect.new()
	arch.size = Vector2(26, 4)
	arch.position = Vector2(-13, -22)
	arch.color = Color(1.0, 0.75, 0.0, 0.5)
	arch.z_index = 10
	door.add_child(arch)
	door.body_entered.connect(_on_door_entered)
	add_child(door)
	_door_node = door

# ============================================================
# COLLISION CALLBACKS
# ============================================================

func _on_orb_touched(body: Node2D, orb: Area2D) -> void:
	# Only react to Po (CharacterBody2D named "Po")
	if not body is CharacterBody2D:
		return
	_orbs_collected += 1
	# Collection VFX: bright flash → shrink → gone
	var tween = create_tween()
	# Flash overbright
	for child in orb.get_children():
		if child is ColorRect:
			var flash_tween = create_tween()
			flash_tween.tween_property(child, "color", Color(3.0, 2.5, 1.0, 1.0), 0.08)
			flash_tween.tween_property(child, "modulate:a", 0.0, 0.12)
	# Scale pop on the orb container
	tween.tween_property(orb, "scale", Vector2(1.8, 1.8), 0.06)
	tween.tween_property(orb, "scale", Vector2(0.1, 0.1), 0.1)
	tween.tween_callback(func():
		# Remove from tracking
		var idx = _orb_nodes.find(orb)
		if idx >= 0:
			_orb_nodes.remove_at(idx)
			_orb_base_y.remove_at(idx)
		orb.queue_free()
	)
	orb_collected.emit(_orbs_collected, _total_orbs)

func _on_door_entered(body: Node2D) -> void:
	if not body is CharacterBody2D or not _door_active:
		return
	_door_active = false
	# Door activation VFX — bright pulse then fade
	if _door_node:
		var tween = create_tween()
		for child in _door_node.get_children():
			if child is ColorRect:
				var glow_tween = create_tween()
				glow_tween.tween_property(child, "color", Color(3.0, 2.5, 1.5, 1.0), 0.15)
				glow_tween.tween_property(child, "modulate:a", 0.4, 0.3)
		tween.tween_interval(0.3)
		tween.tween_callback(func():
			door_reached.emit()
		)

# ============================================================
# ORB BOBBING ANIMATION
# ============================================================

func _process(delta: float) -> void:
	var t = Time.get_ticks_msec() / 1000.0
	for i in range(_orb_nodes.size()):
		if is_instance_valid(_orb_nodes[i]):
			# Gentle sine-wave bob — each orb has unique phase based on position
			var phase = _orb_nodes[i].position.x * 0.02
			var bob = sin(t * 2.5 + phase) * 3.0
			_orb_nodes[i].position.y = _orb_base_y[i] + bob
