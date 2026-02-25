extends BaseEnemy
## Spidat — Spider/Bat chimera with 3 themed attacks.
##
## CONFRONTATION: Flies in → hovers → picks 1 of 3 attacks → flies away.
##   1. SONIC SHRIEK  (bat)    — sonar rings (single expanding OR triple ping)
##   2. WEB SNARE     (spider) — 3 web globs in fan spread
##   3. SOCK BARRAGE  (throw)  — 3 arcing socks in sequence
##
## FLYBY: Flies across dropping debt bills. No scroll-stop.
##
## VFX: Purple/green telegraphs, afterimage trails, screen tint pulses,
## wing flare particles, silk/echo trails on every projectile.
## Target: Sly Cooper level and beyond.

enum Mode { CONFRONTATION, FLYBY }
enum State {
	FLY_IN, HOVER,
	ATTACK_SONAR, ATTACK_WEB, ATTACK_SOCK,
	FLY_AWAY, FLY_ACROSS
}

# ─── Set by spawner ───
var mode: Mode = Mode.CONFRONTATION
var projectile_sock_scene: PackedScene
var projectile_bill_scene: PackedScene
var sonar_ring_scene: PackedScene
var projectile_web_scene: PackedScene

# ─── Movement tuning ───
@export var fly_speed := 250.0

const FLY_IN_TARGET_X := 400.0
const HOVER_DURATION := 1.0
const FLY_AWAY_SPEED := 350.0
const FLYBY_SPEED := 300.0
const FLYBY_DROP_INTERVAL := 0.5
const MAX_FLYBY_DROPS := 3
const SUPERMAN_TILT := -0.4
const HOVER_BOB_AMP := 8.0
const HOVER_BOB_FREQ := 3.0

# ─── Attack tuning ───
# Sonar
const SONAR_TELEGRAPH := 0.3
const SONAR_SINGLE_DELAY := 0.0        # Fire immediately after telegraph
const SONAR_PING_INTERVAL := 0.2       # Time between triple pings
const SONAR_PING_COUNT := 3
# Web
const WEB_TELEGRAPH := 0.25
const WEB_SPREAD_X := [-60.0, 0.0, 60.0]  # Fan spread offsets
const WEB_INITIAL_VY := -80.0              # Slight upward arc
const WEB_GRAVITY := 150.0
# Sock (unchanged from original)
const SOCK_INTERVAL := 0.6
const MAX_SOCKS := 3

# ─── VFX constants ───
const TELEGRAPH_DURATION := 0.25
const AFTERIMAGE_COLOR := Color(0.3, 0.1, 0.5, 0.5)    # Dark spider purple
const AFTERIMAGE_COLOR_SONAR := Color(0.5, 0.15, 0.8, 0.4)  # Brighter for sonar
const AFTERIMAGE_COLOR_WEB := Color(0.3, 0.7, 0.3, 0.4)     # Green for web
const AFTERIMAGE_INTERVAL := 0.04
const AFTERIMAGE_FADE := 0.25
const WING_PARTICLE_COLOR := Color(0.4, 0.1, 0.6, 0.3)

# ─── State ───
var state := State.FLY_IN
var _time := 0.0
var _base_y := 0.0
var _hover_timer := 0.0
var _telegraph_timer := 0.0
var _attack_timer := 0.0
var _attack_count := 0
var _attack_resolved := false
var _afterimage_timer := 0.0
var _wing_particle_timer := 0.0
var _scroll_stop_emitted := false
var _sonar_is_triple := false  # True = triple ping, false = single ring
var _po_ref: CharacterBody2D = null

# Flyby state
var _flyby_drop_timer := 0.0
var _flyby_drop_count := 0

func _ready() -> void:
	super._ready()
	enemy_type = "spidat"
	can_stomp = false
	can_slide_defeat = true
	defeat_score = 5
	_base_y = position.y
	_po_ref = get_tree().current_scene.get_node_or_null("Po")

	if mode == Mode.FLYBY:
		state = State.FLY_ACROSS

	sprite.rotation = SUPERMAN_TILT

func _update_movement(delta: float) -> void:
	_time += delta

	# ─── Ambient VFX: Wing particles (always active while alive) ───
	_wing_particle_timer -= delta
	if _wing_particle_timer <= 0:
		_wing_particle_timer = 0.08
		_spawn_wing_particle()

	match state:
		State.FLY_IN:     _do_fly_in(delta)
		State.HOVER:      _do_hover(delta)
		State.ATTACK_SONAR: _run_attack_sonar(delta)
		State.ATTACK_WEB:   _run_attack_web(delta)
		State.ATTACK_SOCK:  _run_attack_sock(delta)
		State.FLY_AWAY:   _do_fly_away(delta)
		State.FLY_ACROSS: _do_fly_across(delta)

# ════════════════════════════════════════════════════════════════
# MODE A: CONFRONTATION
# ════════════════════════════════════════════════════════════════

func _do_fly_in(delta: float) -> void:
	position.x -= fly_speed * delta
	position.y = _base_y + sin(_time * 2.0) * 10.0
	if position.x <= FLY_IN_TARGET_X and not _scroll_stop_emitted:
		_enter_hover()

func _enter_hover() -> void:
	state = State.HOVER
	_hover_timer = HOVER_DURATION
	_scroll_stop_emitted = true
	_base_y = position.y
	request_scroll_stop.emit()
	# Level out during hover
	var tween = create_tween()
	tween.tween_property(sprite, "rotation", SUPERMAN_TILT * 0.3, 0.3)

func _do_hover(delta: float) -> void:
	_hover_timer -= delta
	position.y = _base_y + sin(_time * HOVER_BOB_FREQ) * HOVER_BOB_AMP
	if _hover_timer <= 0.0:
		_pick_attack()

# ────────────────────────────────────────────────────────────────
# ATTACK SELECTION
# ────────────────────────────────────────────────────────────────

func _pick_attack() -> void:
	var roll = randf()
	if roll < 0.33:
		_enter_attack_sonar()
	elif roll < 0.66:
		_enter_attack_web()
	else:
		_enter_attack_sock()

# ════════════════════════════════════════════════════════════════
# ATTACK 1: SONIC SHRIEK — Bat sonar rings
# ════════════════════════════════════════════════════════════════

func _enter_attack_sonar() -> void:
	state = State.ATTACK_SONAR
	_telegraph_timer = SONAR_TELEGRAPH
	_attack_count = 0
	_attack_timer = 0.0
	_attack_resolved = false
	_afterimage_timer = 0.0
	# 50/50: single expanding ring or triple ping
	_sonar_is_triple = randf() < 0.5

	# Purple telegraph — deeper for sonar
	_flash_telegraph(Color(0.7, 0.1, 1.0, 1.0))
	# ─── VFX: Screen purple tint pulse ───
	_pulse_screen_tint(Color(0.15, 0.0, 0.2, 0.12), 0.4)

	if sprite.sprite_frames.has_animation("attack_sonar"):
		sprite.play("attack_sonar")

func _run_attack_sonar(delta: float) -> void:
	# Continue bobbing (reduced)
	position.y = _base_y + sin(_time * HOVER_BOB_FREQ) * HOVER_BOB_AMP * 0.3

	# Afterimages during attack (sonar purple)
	_afterimage_timer -= delta
	if _afterimage_timer <= 0 and _telegraph_timer <= 0:
		_afterimage_timer = AFTERIMAGE_INTERVAL
		_spawn_afterimage(AFTERIMAGE_COLOR_SONAR)

	if _telegraph_timer > 0:
		_telegraph_timer -= delta
		return

	if _sonar_is_triple:
		# Triple ping mode — fire 3 small rings in sequence
		_attack_timer -= delta
		if _attack_timer <= 0.0 and _attack_count < SONAR_PING_COUNT:
			_fire_sonar_ring(false)  # Small fixed ring
			_attack_count += 1
			_attack_timer = SONAR_PING_INTERVAL
		if _attack_count >= SONAR_PING_COUNT and _attack_timer <= 0:
			_enter_fly_away()
	else:
		# Single ring mode — fire one big expanding ring
		if not _attack_resolved:
			_attack_resolved = true
			_fire_sonar_ring(true)  # Big expanding ring
			_attack_timer = 0.5  # Pause after firing
		_attack_timer -= delta
		if _attack_timer <= 0:
			_enter_fly_away()

func _fire_sonar_ring(expanding: bool) -> void:
	if sonar_ring_scene == null:
		return
	var ring = sonar_ring_scene.instantiate()
	ring.global_position = global_position + Vector2(-15, 0)
	ring.expanding = expanding
	if not expanding:
		ring.fixed_height = 30.0
	get_tree().current_scene.add_child(ring)

	# ─── VFX: Recoil kick on Spidat ───
	var tween = create_tween()
	tween.tween_property(self, "position:x", position.x + 8, 0.05)
	tween.tween_property(self, "position:x", position.x, 0.1)

# ════════════════════════════════════════════════════════════════
# ATTACK 2: WEB SNARE — Spider web fan spread
# ════════════════════════════════════════════════════════════════

func _enter_attack_web() -> void:
	state = State.ATTACK_WEB
	_telegraph_timer = WEB_TELEGRAPH
	_attack_resolved = false
	_afterimage_timer = 0.0

	# Green-white telegraph
	_flash_telegraph(Color(0.4, 1.2, 0.4, 1.0))

	if sprite.sprite_frames.has_animation("attack_web"):
		sprite.play("attack_web")

func _run_attack_web(delta: float) -> void:
	position.y = _base_y + sin(_time * HOVER_BOB_FREQ) * HOVER_BOB_AMP * 0.3

	# Afterimages (green)
	_afterimage_timer -= delta
	if _afterimage_timer <= 0 and _telegraph_timer <= 0:
		_afterimage_timer = AFTERIMAGE_INTERVAL
		_spawn_afterimage(AFTERIMAGE_COLOR_WEB)

	if _telegraph_timer > 0:
		_telegraph_timer -= delta
		# ─── VFX: Spidat bobs upward during telegraph (coiling up) ───
		_base_y -= 15.0 * delta
		return

	if not _attack_resolved:
		_attack_resolved = true
		_fire_web_spread()
		_attack_timer = 0.5  # Pause before fly away

	_attack_timer -= delta
	if _attack_timer <= 0:
		_enter_fly_away()

func _fire_web_spread() -> void:
	if projectile_web_scene == null:
		return

	var target_x = 100.0  # Po's locked x
	var dx = target_x - global_position.x

	for i in range(3):
		var web = projectile_web_scene.instantiate()
		web.global_position = global_position + Vector2(0, 10)
		web.vel = Vector2(dx * 0.5 + WEB_SPREAD_X[i], WEB_INITIAL_VY)
		web.fall_gravity = WEB_GRAVITY
		get_tree().current_scene.add_child(web)

	# ─── VFX: Burst of silk particles at fire point ───
	_spawn_web_burst()

func _spawn_web_burst() -> void:
	for i in range(10):
		var silk = ColorRect.new()
		silk.size = Vector2(2, randf_range(4, 10))
		silk.color = Color(0.7, 0.9, 0.7, 0.5)
		silk.mouse_filter = Control.MOUSE_FILTER_IGNORE
		silk.global_position = global_position + Vector2(randf_range(-8, 8), randf_range(-5, 5))
		silk.rotation = randf_range(-PI, PI)
		get_parent().add_child(silk)

		var vel = Vector2(randf_range(-50, -120), randf_range(-40, 40))
		var tween = silk.create_tween()
		tween.tween_property(silk, "position", silk.position + vel * 0.3, 0.3)
		tween.parallel().tween_property(silk, "modulate:a", 0.0, 0.3)
		tween.tween_callback(silk.queue_free)

# ════════════════════════════════════════════════════════════════
# ATTACK 3: SMELLY SOCK BARRAGE — Arcing sock throws
# ════════════════════════════════════════════════════════════════

func _enter_attack_sock() -> void:
	state = State.ATTACK_SOCK
	_telegraph_timer = TELEGRAPH_DURATION
	_attack_count = 0
	_attack_timer = 0.0
	_afterimage_timer = 0.0

	# Red-orange telegraph (stinky!)
	_flash_telegraph(Color(1.3, 0.6, 0.2, 1.0))

	if sprite.sprite_frames.has_animation("attack_sock"):
		sprite.play("attack_sock")

func _run_attack_sock(delta: float) -> void:
	position.y = _base_y + sin(_time * HOVER_BOB_FREQ) * HOVER_BOB_AMP * 0.5

	# Afterimages (standard purple)
	_afterimage_timer -= delta
	if _afterimage_timer <= 0 and _telegraph_timer <= 0:
		_afterimage_timer = AFTERIMAGE_INTERVAL * 1.5  # Slightly slower for throws
		_spawn_afterimage(AFTERIMAGE_COLOR)

	if _telegraph_timer > 0:
		_telegraph_timer -= delta
		return

	_attack_timer -= delta
	if _attack_timer <= 0.0 and _attack_count < MAX_SOCKS:
		_fire_sock()
		_attack_count += 1
		_attack_timer = SOCK_INTERVAL
	if _attack_count >= MAX_SOCKS and _attack_timer <= 0.0:
		_enter_fly_away()

func _fire_sock() -> void:
	if projectile_sock_scene == null:
		return
	var sock = projectile_sock_scene.instantiate()
	sock.global_position = global_position
	var target_x = 100.0
	var dx = target_x - global_position.x
	sock.vel = Vector2(dx * 0.6, -150.0)
	get_tree().current_scene.add_child(sock)

	# ─── VFX: Stink puff at launch point ───
	_spawn_stink_puff()

func _spawn_stink_puff() -> void:
	for i in range(5):
		var puff = ColorRect.new()
		puff.size = Vector2(randf_range(4, 8), randf_range(4, 8))
		puff.color = Color(0.5, 0.6, 0.2, 0.4)  # Sickly green-yellow
		puff.mouse_filter = Control.MOUSE_FILTER_IGNORE
		puff.global_position = global_position + Vector2(randf_range(-6, 6), randf_range(-6, 6))
		get_parent().add_child(puff)

		var drift = Vector2(randf_range(-30, 30), randf_range(-40, -10))
		var tween = puff.create_tween()
		tween.tween_property(puff, "position", puff.position + drift * 0.4, 0.4)
		tween.parallel().tween_property(puff, "modulate:a", 0.0, 0.4)
		tween.parallel().tween_property(puff, "scale", Vector2(2.0, 2.0), 0.4)
		tween.tween_callback(puff.queue_free)

# ════════════════════════════════════════════════════════════════
# FLY AWAY + FLYBY
# ════════════════════════════════════════════════════════════════

func _enter_fly_away() -> void:
	state = State.FLY_AWAY
	request_scroll_resume.emit()
	sprite.play("move")
	var tween = create_tween()
	tween.tween_property(sprite, "rotation", SUPERMAN_TILT, 0.2)

func _do_fly_away(delta: float) -> void:
	position.x -= FLY_AWAY_SPEED * delta
	position.y -= 30.0 * delta

# ─── MODE B: FLYBY (unchanged from original) ───

func _do_fly_across(delta: float) -> void:
	position.x -= FLYBY_SPEED * delta
	position.y = _base_y + sin(_time * 2.5) * 8.0

	_flyby_drop_timer -= delta
	if _flyby_drop_timer <= 0.0 and _flyby_drop_count < MAX_FLYBY_DROPS:
		if position.x < 350.0 and position.x > 50.0:
			_drop_bill()
			_flyby_drop_count += 1
			_flyby_drop_timer = FLYBY_DROP_INTERVAL

func _drop_bill() -> void:
	if projectile_bill_scene == null:
		return
	var bill = projectile_bill_scene.instantiate()
	bill.global_position = global_position + Vector2(0, 10)
	get_tree().current_scene.add_child(bill)

# ════════════════════════════════════════════════════════════════
# VFX ENGINE — Telegraph, Afterimages, Wing Particles, Screen Tint
# ════════════════════════════════════════════════════════════════

func _flash_telegraph(color: Color = Color(1.5, 0.3, 0.3, 1.0)) -> void:
	sprite.modulate = color
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color.WHITE, TELEGRAPH_DURATION)
	# Flash HUD danger vignette
	var hud_node = get_tree().current_scene.get_node_or_null("HUD")
	if hud_node and hud_node.has_method("flash_danger"):
		hud_node.flash_danger()

func _spawn_afterimage(color: Color = AFTERIMAGE_COLOR) -> void:
	var ghost = Sprite2D.new()
	ghost.texture = sprite.sprite_frames.get_frame_texture(sprite.animation, sprite.frame)
	ghost.global_position = sprite.global_position
	ghost.scale = sprite.scale
	ghost.modulate = color
	ghost.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	ghost.z_index = z_index - 1
	get_parent().add_child(ghost)
	var tween = ghost.create_tween()
	tween.tween_property(ghost, "modulate:a", 0.0, AFTERIMAGE_FADE)
	tween.parallel().tween_property(ghost, "scale", ghost.scale * 1.1, AFTERIMAGE_FADE)
	tween.tween_callback(ghost.queue_free)

func _spawn_wing_particle() -> void:
	## Tiny particles shed from wings — always active, ambient life
	var p = ColorRect.new()
	p.size = Vector2(2, 2)
	p.color = WING_PARTICLE_COLOR
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	# Spawn from wing area (offset from center)
	var wing_offset = Vector2(randf_range(-12, 12), randf_range(-18, -5))
	p.global_position = global_position + wing_offset
	p.z_index = z_index - 1
	get_parent().add_child(p)

	var drift = Vector2(randf_range(10, 30), randf_range(-15, 15))
	var tween = p.create_tween()
	tween.tween_property(p, "position", p.position + drift * 0.5, 0.5)
	tween.parallel().tween_property(p, "modulate:a", 0.0, 0.5)
	tween.tween_callback(p.queue_free)

func _pulse_screen_tint(color: Color, duration: float) -> void:
	## Brief screen tint overlay — sells the "echolocation" feel
	var overlay = ColorRect.new()
	overlay.size = Vector2(640, 360)
	overlay.position = Vector2(-320, -180)  # Center on screen (approx)
	overlay.color = color
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	overlay.z_index = 90
	get_tree().current_scene.add_child(overlay)
	var tween = overlay.create_tween()
	tween.tween_property(overlay, "modulate:a", 0.0, duration)
	tween.tween_callback(overlay.queue_free)

# ════════════════════════════════════════════════════════════════
# DEFEAT
# ════════════════════════════════════════════════════════════════

func _on_body_entered(body: Node2D) -> void:
	if _defeated or _hit:
		return

	# Slide defeat
	if can_slide_defeat and body.get("is_sliding") == true:
		_die()
		if body.has_method("collect_pick"):
			body.collect_pick(defeat_score)
		if body.has_method("slide_defeat_flash"):
			body.slide_defeat_flash()
		return

	# Can't stomp a flying enemy
	# Contact damage
	if body.has_method("stumble"):
		_hit = true
		var dmg = 1
		# Bonus damage if hit during sonar (echolocation disorientation)
		if state == State.ATTACK_SONAR:
			dmg = 2
		body.stumble(dmg)
		enemy_hit_po.emit(enemy_type)

func _die() -> void:
	super._die()
	if _scroll_stop_emitted:
		request_scroll_resume.emit()
	# ─── VFX: Death burst — purple wing feathers scatter ───
	for i in range(8):
		var feather = ColorRect.new()
		feather.size = Vector2(3, randf_range(5, 10))
		feather.color = Color(0.5, 0.15, 0.7, 0.6)
		feather.mouse_filter = Control.MOUSE_FILTER_IGNORE
		feather.global_position = global_position + Vector2(randf_range(-10, 10), randf_range(-10, 10))
		feather.rotation = randf_range(-PI, PI)
		get_parent().add_child(feather)
		var vel = Vector2(randf_range(-80, 80), randf_range(-100, -20))
		var tween = feather.create_tween()
		tween.tween_property(feather, "position", feather.position + vel * 0.5, 0.5)
		tween.parallel().tween_property(feather, "modulate:a", 0.0, 0.5)
		tween.parallel().tween_property(feather, "rotation", feather.rotation + randf_range(-2, 2), 0.5)
		tween.tween_callback(feather.queue_free)
