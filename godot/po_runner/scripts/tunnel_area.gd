extends Node2D
## The Librarynth Tunnel — three-zone journey from platformer door to the amphitheatre.
## Zone 1: Crystal Cave (amber crystals, dark stone)
## Zone 2: Library Corridors (bookshelves, candle glow, floating pages)
## Zone 3: Spirit Realm (void, floating geometric platforms, wisp light)
## Ends at amphitheatre where Captain Magus waits.
## No enemies — pure platforming navigation. Peaceful journey.

signal orb_collected(count: int, total: int)
signal magus_reached
signal exit_portal_reached

# ─── Zone color palettes ───────────────────────────────────────────────────

# Zone 1: Crystal Cave
const CAVE_PLATFORM := Color(0.22, 0.2, 0.25, 1.0)       # Dark grey stone
const CAVE_PLATFORM_TOP := Color(0.35, 0.3, 0.38, 1.0)   # Lighter stone top
const CAVE_CRYSTAL := Color(1.0, 0.75, 0.0, 0.5)         # Amber crystal glow
const CAVE_CRYSTAL_CORE := Color(1.0, 0.8, 0.2, 0.85)    # Crystal bright core
const CAVE_BG := Color(0.08, 0.06, 0.1, 0.9)             # Deep cave dark

# Zone 2: Library Corridors
const LIB_PLATFORM := Color(0.3, 0.22, 0.15, 1.0)        # Dark wood (bookshelf)
const LIB_PLATFORM_TOP := Color(0.45, 0.35, 0.2, 1.0)    # Wood top highlight
const LIB_CANDLE := Color(1.0, 0.65, 0.2, 0.4)           # Warm candle glow
const LIB_PAGE := Color(0.9, 0.85, 0.75, 0.3)            # Floating page
const LIB_BG := Color(0.12, 0.08, 0.06, 0.85)            # Dark library

# Zone 3: Spirit Realm
const SPIRIT_PLATFORM := Color(0.2, 0.15, 0.35, 1.0)     # Deep purple
const SPIRIT_PLATFORM_TOP := Color(0.4, 0.3, 0.6, 1.0)   # Purple highlight
const SPIRIT_GLOW := Color(0.6, 0.4, 1.0, 0.15)          # Ethereal border glow
const SPIRIT_BG := Color(0.04, 0.02, 0.08, 0.95)         # Near-void

# Amphitheatre
const AMPH_PLATFORM := Color(0.25, 0.2, 0.15, 1.0)       # Warm wood
const AMPH_PLATFORM_TOP := Color(0.45, 0.38, 0.25, 1.0)  # Stage highlight
const AMPH_ARCH := Color(1.0, 0.75, 0.0, 0.4)            # Amber arch glow

# Shared
const ORB_COLOR := Color(1.0, 0.75, 0.0, 0.85)
const ORB_GLOW := Color(1.0, 0.75, 0.0, 0.12)
const GROUND_COLOR := Color(0.12, 0.1, 0.08, 1.0)
const PORTAL_FRAME := Color(1.0, 0.75, 0.0, 0.6)
const PORTAL_INNER := Color(1.0, 0.85, 0.3, 0.35)

# ─── State ─────────────────────────────────────────────────────────────────

var _orbs_collected := 0
var _total_orbs := 0
var _orb_nodes: Array[Area2D] = []
var _orb_base_y: Array[float] = []
var _magus_active := true
var _portal_node: Area2D = null
var _portal_active := false
var _page_nodes: Array[ColorRect] = []       # Floating pages (ambient)
var _page_base_y: Array[float] = []

# ─── Build ─────────────────────────────────────────────────────────────────

func _ready() -> void:
	_build_ground()
	_build_zone_backgrounds()
	_build_zone1_crystal_cave()
	_build_zone2_library()
	_build_zone3_spirit_realm()
	_build_amphitheatre()
	_build_orbs()
	_build_magus_npc()
	_build_exit_portal()

# ============================================================
# GROUND — Continuous floor across entire tunnel
# ============================================================

func _build_ground() -> void:
	var ground = StaticBody2D.new()
	ground.position = Vector2(1300, 318)
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(3200, 20)  # x=-300 to x=2900
	shape.shape = rect
	ground.add_child(shape)
	var visual = ColorRect.new()
	visual.size = Vector2(3200, 40)
	visual.position = Vector2(-1600, -10)
	visual.color = GROUND_COLOR
	visual.z_index = -1
	ground.add_child(visual)
	add_child(ground)

# ============================================================
# ZONE BACKGROUNDS — Colored overlays for atmosphere
# ============================================================

func _build_zone_backgrounds() -> void:
	# Zone 1: Crystal Cave bg
	_add_bg_rect(Vector2(-100, -50), Vector2(950, 420), CAVE_BG)
	# Zone 2: Library bg
	_add_bg_rect(Vector2(800, -50), Vector2(900, 420), LIB_BG)
	# Zone 3: Spirit Realm bg
	_add_bg_rect(Vector2(1600, -50), Vector2(700, 420), SPIRIT_BG)
	# Amphitheatre — slightly lighter
	_add_bg_rect(Vector2(2200, -50), Vector2(500, 420), Color(0.1, 0.08, 0.06, 0.8))

func _add_bg_rect(pos: Vector2, sz: Vector2, color: Color) -> void:
	var bg = ColorRect.new()
	bg.position = pos
	bg.size = sz
	bg.color = color
	bg.z_index = -5
	add_child(bg)

# ============================================================
# ZONE 1: CRYSTAL CAVE (x=0 → x=800)
# ============================================================

func _build_zone1_crystal_cave() -> void:
	# Platforms — ascending path with stone feel
	_create_platform(Vector2(180, 285), 80, 12, CAVE_PLATFORM, CAVE_PLATFORM_TOP)
	_create_platform(Vector2(350, 258), 70, 12, CAVE_PLATFORM, CAVE_PLATFORM_TOP)
	_create_platform(Vector2(520, 235), 85, 12, CAVE_PLATFORM, CAVE_PLATFORM_TOP)
	_create_platform(Vector2(700, 265), 90, 12, CAVE_PLATFORM, CAVE_PLATFORM_TOP)

	# Crystal decorations — amber glow accents
	_add_crystal(Vector2(120, 300))
	_add_crystal(Vector2(420, 295))
	_add_crystal(Vector2(620, 250))
	_add_crystal(Vector2(770, 305))

func _add_crystal(pos: Vector2) -> void:
	# Small glowing amber crystal (decorative, no collision)
	var core = ColorRect.new()
	core.size = Vector2(4, 8)
	core.position = Vector2(pos.x - 2, pos.y - 8)
	core.color = CAVE_CRYSTAL_CORE
	core.z_index = 3
	add_child(core)
	var glow = ColorRect.new()
	glow.size = Vector2(10, 14)
	glow.position = Vector2(pos.x - 5, pos.y - 11)
	glow.color = CAVE_CRYSTAL
	glow.z_index = 2
	add_child(glow)

# ============================================================
# ZONE 2: LIBRARY CORRIDORS (x=800 → x=1600)
# ============================================================

func _build_zone2_library() -> void:
	# Taller platforms — bookshelf-like
	_create_platform(Vector2(900, 275), 90, 18, LIB_PLATFORM, LIB_PLATFORM_TOP)
	_create_platform(Vector2(1080, 248), 75, 18, LIB_PLATFORM, LIB_PLATFORM_TOP)
	_create_platform(Vector2(1250, 270), 85, 18, LIB_PLATFORM, LIB_PLATFORM_TOP)
	_create_platform(Vector2(1440, 240), 95, 18, LIB_PLATFORM, LIB_PLATFORM_TOP)

	# Candle glows — warm orange accents
	_add_candle(Vector2(860, 260))
	_add_candle(Vector2(1150, 235))
	_add_candle(Vector2(1380, 225))

	# Floating pages — ambient non-collision rectangles
	_add_page(Vector2(950, 200))
	_add_page(Vector2(1120, 180))
	_add_page(Vector2(1300, 210))
	_add_page(Vector2(1500, 190))

func _add_candle(pos: Vector2) -> void:
	# Small candle flame glow (decorative)
	var flame = ColorRect.new()
	flame.size = Vector2(3, 5)
	flame.position = Vector2(pos.x - 1.5, pos.y - 5)
	flame.color = Color(1.0, 0.8, 0.3, 0.9)
	flame.z_index = 4
	add_child(flame)
	var glow = ColorRect.new()
	glow.size = Vector2(14, 14)
	glow.position = Vector2(pos.x - 7, pos.y - 10)
	glow.color = LIB_CANDLE
	glow.z_index = 2
	add_child(glow)

func _add_page(pos: Vector2) -> void:
	# Floating page — drifts gently (animated in _process)
	var page = ColorRect.new()
	page.size = Vector2(6, 8)
	page.position = pos
	page.color = LIB_PAGE
	page.z_index = 3
	add_child(page)
	_page_nodes.append(page)
	_page_base_y.append(pos.y)

# ============================================================
# ZONE 3: SPIRIT REALM (x=1600 → x=2200)
# ============================================================

func _build_zone3_spirit_realm() -> void:
	# Smaller floating platforms with glow borders
	_create_spirit_platform(Vector2(1700, 275), 65, 10)
	_create_spirit_platform(Vector2(1850, 250), 55, 10)
	_create_spirit_platform(Vector2(1980, 270), 60, 10)
	_create_spirit_platform(Vector2(2120, 248), 70, 10)

func _create_spirit_platform(pos: Vector2, width: float, height: float) -> void:
	# Platform with ethereal glow border
	_create_platform(pos, width, height, SPIRIT_PLATFORM, SPIRIT_PLATFORM_TOP)
	# Glow border around platform
	var glow = ColorRect.new()
	glow.size = Vector2(width + 6, height + 6)
	glow.position = Vector2(pos.x - (width + 6) / 2.0, pos.y - (height + 6) / 2.0)
	glow.color = SPIRIT_GLOW
	glow.z_index = 1
	add_child(glow)

# ============================================================
# AMPHITHEATRE (x=2200 → x=2600)
# ============================================================

func _build_amphitheatre() -> void:
	# Wide stage platform
	_create_platform(Vector2(2380, 290), 320, 14, AMPH_PLATFORM, AMPH_PLATFORM_TOP)

	# Amber arch — tall decorative frame behind Magus
	var arch_left = ColorRect.new()
	arch_left.size = Vector2(4, 60)
	arch_left.position = Vector2(2360, 210)
	arch_left.color = AMPH_ARCH
	arch_left.z_index = 1
	add_child(arch_left)

	var arch_right = ColorRect.new()
	arch_right.size = Vector2(4, 60)
	arch_right.position = Vector2(2440, 210)
	arch_right.color = AMPH_ARCH
	arch_right.z_index = 1
	add_child(arch_right)

	var arch_top = ColorRect.new()
	arch_top.size = Vector2(84, 4)
	arch_top.position = Vector2(2360, 208)
	arch_top.color = Color(1.0, 0.75, 0.0, 0.55)
	arch_top.z_index = 1
	add_child(arch_top)

# ============================================================
# SHARED PLATFORM BUILDER
# ============================================================

func _create_platform(pos: Vector2, width: float, height: float,
		body_color: Color, top_color: Color) -> void:
	var platform = StaticBody2D.new()
	platform.position = pos
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(width, height)
	shape.shape = rect
	platform.add_child(shape)
	# Main body
	var body = ColorRect.new()
	body.size = Vector2(width, height)
	body.position = Vector2(-width / 2.0, -height / 2.0)
	body.color = body_color
	platform.add_child(body)
	# Top highlight
	var top_strip = ColorRect.new()
	top_strip.size = Vector2(width, 2)
	top_strip.position = Vector2(-width / 2.0, -height / 2.0)
	top_strip.color = top_color
	platform.add_child(top_strip)
	# Side shadow
	var side = ColorRect.new()
	side.size = Vector2(2, height)
	side.position = Vector2(width / 2.0 - 2, -height / 2.0)
	side.color = Color(0.06, 0.04, 0.03, 0.5)
	platform.add_child(side)
	add_child(platform)

# ============================================================
# ORBS — Breadcrumb trail through tunnel
# ============================================================

func _create_orb(pos: Vector2) -> void:
	var orb = Area2D.new()
	orb.position = pos
	orb.collision_layer = 0
	orb.collision_mask = 1
	var shape = CollisionShape2D.new()
	var circle = CircleShape2D.new()
	circle.radius = 7.0
	shape.shape = circle
	orb.add_child(shape)
	var core = ColorRect.new()
	core.size = Vector2(6, 6)
	core.position = Vector2(-3, -3)
	core.color = ORB_COLOR
	core.z_index = 8
	orb.add_child(core)
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
	# Zone 1: Crystal Cave
	_create_orb(Vector2(180, 268))
	_create_orb(Vector2(520, 218))
	# Zone 2: Library
	_create_orb(Vector2(1080, 230))
	_create_orb(Vector2(1440, 222))
	# Zone 3: Spirit Realm
	_create_orb(Vector2(1850, 232))
	_create_orb(Vector2(2120, 230))
	# Amphitheatre approach
	_create_orb(Vector2(2280, 272))

# ============================================================
# MAGUS NPC — Stands in amphitheatre, triggers dialogue
# ============================================================

func _build_magus_npc() -> void:
	var magus = Area2D.new()
	magus.name = "MagusNPC"
	magus.position = Vector2(2400, 268)  # Center of stage platform (feet near y=283)
	magus.collision_layer = 0
	magus.collision_mask = 1
	# Trigger area — wider to catch approach
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(40, 50)
	shape.shape = rect
	magus.add_child(shape)

	# Magus sprite — AnimatedSprite2D with idle animation
	var sprite = AnimatedSprite2D.new()
	sprite.name = "MagusSprite"
	var frames = SpriteFrames.new()

	# Load idle animation frames (west-facing = facing left toward approaching Po)
	var idle_textures: Array[Texture2D] = []
	for i in range(4):
		var path = "res://sprites/magus/magus_idle_%02d.png" % i
		var tex = load(path)
		if tex:
			idle_textures.append(tex)

	if idle_textures.size() > 0:
		frames.add_animation("idle")
		frames.set_animation_speed("idle", 4)  # Slow breathing
		frames.set_animation_loop("idle", true)
		for tex in idle_textures:
			frames.add_frame("idle", tex)
		sprite.sprite_frames = frames
		sprite.animation = "idle"
		sprite.play()
	else:
		# Fallback: static sprite if frames not found
		var static_tex = load("res://sprites/magus/magus_static.png")
		if static_tex:
			frames.add_animation("default")
			frames.add_frame("default", static_tex)
			sprite.sprite_frames = frames

	sprite.z_index = 10
	magus.add_child(sprite)

	magus.body_entered.connect(_on_magus_touched)
	add_child(magus)

# ============================================================
# EXIT PORTAL — Appears after Magus dialogue ends
# ============================================================

func _build_exit_portal() -> void:
	_portal_node = Area2D.new()
	_portal_node.name = "ExitPortal"
	_portal_node.position = Vector2(2550, 258)
	_portal_node.collision_layer = 0
	_portal_node.collision_mask = 1
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(22, 40)
	shape.shape = rect
	_portal_node.add_child(shape)
	# Portal frame
	var frame = ColorRect.new()
	frame.size = Vector2(22, 40)
	frame.position = Vector2(-11, -20)
	frame.color = PORTAL_FRAME
	frame.z_index = 8
	_portal_node.add_child(frame)
	# Inner glow
	var inner = ColorRect.new()
	inner.size = Vector2(16, 34)
	inner.position = Vector2(-8, -17)
	inner.color = PORTAL_INNER
	inner.z_index = 9
	_portal_node.add_child(inner)
	# Top arch
	var arch = ColorRect.new()
	arch.size = Vector2(26, 4)
	arch.position = Vector2(-13, -22)
	arch.color = Color(1.0, 0.75, 0.0, 0.5)
	arch.z_index = 10
	_portal_node.add_child(arch)
	_portal_node.body_entered.connect(_on_portal_entered)
	# Start HIDDEN — appears after Magus dialogue
	_portal_node.visible = false
	_portal_node.set_deferred("monitoring", false)
	add_child(_portal_node)

## Called by main.gd after Magus dialogue ends — reveals the exit portal.
func activate_exit_portal() -> void:
	if _portal_node:
		_portal_active = true
		_portal_node.visible = true
		_portal_node.monitoring = true
		# Fade-in glow effect
		_portal_node.modulate = Color(1, 1, 1, 0)
		var tween = create_tween()
		tween.tween_property(_portal_node, "modulate:a", 1.0, 0.5)

# ============================================================
# COLLISION CALLBACKS
# ============================================================

func _on_orb_touched(body: Node2D, orb: Area2D) -> void:
	if not body is CharacterBody2D:
		return
	_orbs_collected += 1
	var tween = create_tween()
	for child in orb.get_children():
		if child is ColorRect:
			var flash_tween = create_tween()
			flash_tween.tween_property(child, "color", Color(3.0, 2.5, 1.0, 1.0), 0.08)
			flash_tween.tween_property(child, "modulate:a", 0.0, 0.12)
	tween.tween_property(orb, "scale", Vector2(1.8, 1.8), 0.06)
	tween.tween_property(orb, "scale", Vector2(0.1, 0.1), 0.1)
	tween.tween_callback(func():
		var idx = _orb_nodes.find(orb)
		if idx >= 0:
			_orb_nodes.remove_at(idx)
			_orb_base_y.remove_at(idx)
		orb.queue_free()
	)
	orb_collected.emit(_orbs_collected, _total_orbs)

func _on_magus_touched(body: Node2D) -> void:
	if not body is CharacterBody2D or not _magus_active:
		return
	_magus_active = false
	magus_reached.emit()

func _on_portal_entered(body: Node2D) -> void:
	if not body is CharacterBody2D or not _portal_active:
		return
	_portal_active = false
	# Portal activation VFX
	if _portal_node:
		var tween = create_tween()
		for child in _portal_node.get_children():
			if child is ColorRect:
				var glow_tween = create_tween()
				glow_tween.tween_property(child, "color", Color(3.0, 2.5, 1.5, 1.0), 0.15)
				glow_tween.tween_property(child, "modulate:a", 0.4, 0.3)
		tween.tween_interval(0.3)
		tween.tween_callback(func():
			exit_portal_reached.emit()
		)

# ============================================================
# ANIMATION — Orb bobbing + floating pages
# ============================================================

func _process(delta: float) -> void:
	var t = Time.get_ticks_msec() / 1000.0

	# Orb bobbing
	for i in range(_orb_nodes.size()):
		if is_instance_valid(_orb_nodes[i]):
			var phase = _orb_nodes[i].position.x * 0.02
			var bob = sin(t * 2.5 + phase) * 3.0
			_orb_nodes[i].position.y = _orb_base_y[i] + bob

	# Floating page drift (library zone)
	for i in range(_page_nodes.size()):
		if is_instance_valid(_page_nodes[i]):
			var phase = _page_nodes[i].position.x * 0.03
			var drift_y = sin(t * 1.5 + phase) * 5.0
			var drift_x = cos(t * 0.8 + phase * 1.3) * 2.0
			_page_nodes[i].position.y = _page_base_y[i] + drift_y
			_page_nodes[i].position.x += drift_x * delta
