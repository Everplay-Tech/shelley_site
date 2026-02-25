extends BaseEnemy
## Mantigre — Mantis/Tiger chimera with Michael Jackson flair.
## State machine: APPROACH (moonwalk) → CONFRONT (MJ stance) → ATTACK → CHARGE.
## 3 unique attacks: Thriller Spin, Smooth Criminal Lunge, Billie Jean Stomp.
## World scrolling STOPS during the confrontation for a dramatic face-off.

enum State { APPROACH, CONFRONT, ATTACK_SPIN, ATTACK_LUNGE, ATTACK_STOMP, CHARGE }

@export var approach_speed := 80.0     # Extra speed on top of world scroll
@export var shockwave_scene: PackedScene

const TRIGGER_X := 400.0              # Screen x where confrontation triggers
const CONFRONT_DURATION := 1.8        # MJ stand-off duration (seconds)
const CHARGE_SPEED := 350.0           # Post-attack rush speed
const BOB_SPEED_IDLE := 8.0
const BOB_SPEED_CONFRONT := 12.0
const BOB_AMP_IDLE := 1.5
const BOB_AMP_CONFRONT := 3.0

# Attack tuning
const SPIN_RADIUS := 60.0             # AoE radius for Thriller Spin
const SPIN_DURATION := 0.6
const SPIN_DAMAGE := 2
const LUNGE_DISTANCE := 150.0         # How far Smooth Criminal dashes
const LUNGE_DURATION := 0.4
const LUNGE_DAMAGE := 2
const STOMP_DAMAGE := 1               # Shockwave handles its own damage
const TELEGRAPH_DURATION := 0.25      # Red flash warning before attack

# Afterimage
const AFTERIMAGE_COLOR := Color(0.5, 0.2, 0.8, 0.5)   # Dark purple
const AFTERIMAGE_INTERVAL := 0.04
const AFTERIMAGE_FADE := 0.25

var state := State.APPROACH
var _time := 0.0
var _confront_timer := 0.0
var _attack_timer := 0.0
var _telegraph_timer := 0.0
var _scroll_stop_emitted := false
var _attack_resolved := false  # Did this attack's damage check fire?
var _afterimage_timer := 0.0
var _po_ref: CharacterBody2D = null

func _ready() -> void:
	super._ready()
	enemy_type = "mantigre"
	can_stomp = true
	can_slide_defeat = true
	defeat_score = 3
	# Find Po reference for distance checks
	_po_ref = get_tree().current_scene.get_node_or_null("Po")

func _update_movement(delta: float) -> void:
	_time += delta

	match state:
		State.APPROACH:
			# Moonwalk toward Po
			position.x -= approach_speed * delta
			position.y += sin(_time * BOB_SPEED_IDLE) * BOB_AMP_IDLE * delta
			if sprite.sprite_frames.has_animation("moonwalk"):
				if sprite.animation != "moonwalk":
					sprite.play("moonwalk")
			# Trigger confrontation when on screen
			if position.x <= TRIGGER_X and not _scroll_stop_emitted:
				_enter_confront()

		State.CONFRONT:
			_confront_timer -= delta
			position.y += sin(_time * BOB_SPEED_CONFRONT) * BOB_AMP_CONFRONT * delta
			if _confront_timer <= 0.0:
				_pick_attack()

		State.ATTACK_SPIN:
			_run_attack_spin(delta)

		State.ATTACK_LUNGE:
			_run_attack_lunge(delta)

		State.ATTACK_STOMP:
			_run_attack_stomp(delta)

		State.CHARGE:
			position.x -= CHARGE_SPEED * delta

# ============================================================
# STATE TRANSITIONS
# ============================================================

func _enter_confront() -> void:
	state = State.CONFRONT
	_confront_timer = CONFRONT_DURATION
	_scroll_stop_emitted = true
	request_scroll_stop.emit()
	if sprite.sprite_frames.has_animation("confront"):
		sprite.play("confront")

func _pick_attack() -> void:
	var roll = randf()
	if roll < 0.33:
		_enter_attack_spin()
	elif roll < 0.66:
		_enter_attack_lunge()
	else:
		_enter_attack_stomp()

func _enter_charge() -> void:
	state = State.CHARGE
	sprite.play("move")
	request_scroll_resume.emit()

# ============================================================
# ATTACK 1: THRILLER SPIN — AoE pirouette, 2 damage
# ============================================================

func _enter_attack_spin() -> void:
	state = State.ATTACK_SPIN
	_telegraph_timer = TELEGRAPH_DURATION
	_attack_timer = SPIN_DURATION
	_attack_resolved = false
	_afterimage_timer = 0.0
	# Telegraph: red flash
	_flash_telegraph()

func _run_attack_spin(delta: float) -> void:
	if _telegraph_timer > 0:
		_telegraph_timer -= delta
		if _telegraph_timer <= 0:
			# Start the spin
			if sprite.sprite_frames.has_animation("attack_spin"):
				sprite.play("attack_spin")
		return

	_attack_timer -= delta
	# Spawn afterimages during spin
	_afterimage_timer -= delta
	if _afterimage_timer <= 0:
		_afterimage_timer = AFTERIMAGE_INTERVAL
		_spawn_afterimage()

	# Damage check at midpoint
	if not _attack_resolved and _attack_timer < SPIN_DURATION * 0.5:
		_attack_resolved = true
		if _po_ref and global_position.distance_to(_po_ref.global_position) < SPIN_RADIUS:
			if _po_ref.has_method("stumble"):
				_po_ref.stumble(SPIN_DAMAGE)
				enemy_hit_po.emit(enemy_type)

	if _attack_timer <= 0:
		_enter_charge()

# ============================================================
# ATTACK 2: SMOOTH CRIMINAL LUNGE — dash forward, 2 damage
# ============================================================

func _enter_attack_lunge() -> void:
	state = State.ATTACK_LUNGE
	_telegraph_timer = TELEGRAPH_DURATION * 0.6  # Shorter windup — faster attack
	_attack_timer = LUNGE_DURATION
	_attack_resolved = false
	_afterimage_timer = 0.0
	_flash_telegraph()

func _run_attack_lunge(delta: float) -> void:
	if _telegraph_timer > 0:
		_telegraph_timer -= delta
		if _telegraph_timer <= 0:
			if sprite.sprite_frames.has_animation("attack_lunge"):
				sprite.play("attack_lunge")
		return

	_attack_timer -= delta
	# Dash left
	var dash_speed = LUNGE_DISTANCE / LUNGE_DURATION
	position.x -= dash_speed * delta
	# Afterimages during dash
	_afterimage_timer -= delta
	if _afterimage_timer <= 0:
		_afterimage_timer = AFTERIMAGE_INTERVAL
		_spawn_afterimage()

	if _attack_timer <= 0:
		_enter_charge()

# Lunge uses body_entered for damage (override from base)

# ============================================================
# ATTACK 3: BILLIE JEAN STOMP — ground shockwave, 1 damage
# ============================================================

func _enter_attack_stomp() -> void:
	state = State.ATTACK_STOMP
	_telegraph_timer = TELEGRAPH_DURATION + 0.05  # Slightly longer rear-up
	_attack_timer = 0.3  # Stomp animation duration
	_attack_resolved = false
	_flash_telegraph()

func _run_attack_stomp(delta: float) -> void:
	if _telegraph_timer > 0:
		_telegraph_timer -= delta
		if _telegraph_timer <= 0:
			if sprite.sprite_frames.has_animation("attack_stomp"):
				sprite.play("attack_stomp")
		return

	_attack_timer -= delta
	# Spawn shockwave at midpoint
	if not _attack_resolved and _attack_timer < 0.15:
		_attack_resolved = true
		_spawn_shockwave()

	if _attack_timer <= 0:
		_enter_charge()

func _spawn_shockwave() -> void:
	if shockwave_scene == null:
		return
	var wave = shockwave_scene.instantiate()
	# Spawn at Mantigre's feet, traveling left
	wave.global_position = Vector2(global_position.x - 20, global_position.y)
	get_tree().current_scene.add_child(wave)

# ============================================================
# BODY CONTACT — Variable damage based on state
# ============================================================

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

	# Stomp check
	if can_stomp and body.get("velocity") != null:
		var vel: Vector2 = body.velocity
		if vel.y > 50 and body.global_position.y < global_position.y - STOMP_Y_THRESHOLD:
			_die()
			if body.has_method("collect_pick"):
				body.collect_pick(defeat_score)
			if body.has_method("stomp_bounce"):
				body.stomp_bounce()
			return

	# Damage Po — variable based on attack state
	if body.has_method("stumble"):
		_hit = true
		var dmg = LUNGE_DAMAGE if state == State.ATTACK_LUNGE else 1
		body.stumble(dmg)
		enemy_hit_po.emit(enemy_type)

# ============================================================
# VFX — Telegraph, Afterimages
# ============================================================

func _flash_telegraph() -> void:
	# Red flash on sprite + HUD danger vignette
	sprite.modulate = Color(1.5, 0.3, 0.3, 1.0)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color.WHITE, TELEGRAPH_DURATION)
	# Flash HUD danger vignette if accessible
	var hud_node = get_tree().current_scene.get_node_or_null("HUD")
	if hud_node and hud_node.has_method("flash_danger"):
		hud_node.flash_danger()

func _spawn_afterimage() -> void:
	var ghost = Sprite2D.new()
	ghost.texture = sprite.sprite_frames.get_frame_texture(sprite.animation, sprite.frame)
	ghost.global_position = sprite.global_position
	ghost.scale = sprite.scale
	ghost.modulate = AFTERIMAGE_COLOR
	ghost.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	ghost.z_index = z_index - 1
	get_parent().add_child(ghost)
	var tween = ghost.create_tween()
	tween.tween_property(ghost, "modulate:a", 0.0, AFTERIMAGE_FADE)
	tween.parallel().tween_property(ghost, "scale", ghost.scale * 1.1, AFTERIMAGE_FADE)
	tween.tween_callback(ghost.queue_free)

func _die() -> void:
	super._die()
	# Ensure world resumes if killed during encounter
	if _scroll_stop_emitted:
		request_scroll_resume.emit()
