extends BaseEnemy
## Spidat — Spider/Bat chimera. Two attack modes:
##
## MODE A (CONFRONTATION): Flies in Superman-style, world STOPS scrolling.
##   Hovers above Po, throws smelly socks. Flies away when done.
##
## MODE B (FLYBY): Flies across screen Superman-style, scrolling CONTINUES.
##   Drops debt bills as it passes over Po. No scroll-stop.
##
## Rizky: Add "fly" animation, tune speeds/timers. Swap projectile scenes
## for different enemy variants. The mode system is reusable — any enemy
## can have multiple attack patterns selected at spawn time.

enum Mode { CONFRONTATION, FLYBY }
enum State { FLY_IN, HOVER, ATTACK, FLY_AWAY, FLY_ACROSS }

# --- Set by spawner ---
var mode: Mode = Mode.CONFRONTATION
var projectile_sock_scene: PackedScene
var projectile_bill_scene: PackedScene

# --- Tuning ---
@export var fly_speed := 250.0            # Approach speed

const FLY_IN_TARGET_X := 400.0           # Where confrontation triggers
const HOVER_DURATION := 1.0              # Menacing hover before attack
const ATTACK_INTERVAL := 0.6             # Time between sock throws
const MAX_ATTACKS := 3                   # Socks per encounter
const FLY_AWAY_SPEED := 350.0            # Exit speed after attack
const FLYBY_SPEED := 300.0               # Flyby horizontal speed
const FLYBY_DROP_INTERVAL := 0.5         # Time between bill drops
const MAX_FLYBY_DROPS := 3              # Bills per flyby
const SUPERMAN_TILT := -0.4             # Radians (~-23 degrees) forward lean
const HOVER_BOB_AMP := 8.0              # Hover bob amplitude
const HOVER_BOB_FREQ := 3.0             # Hover bob frequency

# --- State ---
var state := State.FLY_IN
var _time := 0.0
var _base_y := 0.0
var _hover_timer := 0.0
var _attack_timer := 0.0
var _attack_count := 0
var _flyby_drop_timer := 0.0
var _flyby_drop_count := 0
var _scroll_stop_emitted := false

func _ready() -> void:
	super._ready()
	enemy_type = "spidat"
	can_stomp = false        # Can't stomp a flying enemy
	can_slide_defeat = true  # Slide under to defeat
	defeat_score = 5         # Worth more — harder to defeat
	_base_y = position.y

	# Set initial state based on mode
	if mode == Mode.FLYBY:
		state = State.FLY_ACROSS

	# Superman tilt
	sprite.rotation = SUPERMAN_TILT

func _update_movement(delta: float) -> void:
	_time += delta

	match state:
		State.FLY_IN:
			_do_fly_in(delta)
		State.HOVER:
			_do_hover(delta)
		State.ATTACK:
			_do_attack(delta)
		State.FLY_AWAY:
			_do_fly_away(delta)
		State.FLY_ACROSS:
			_do_fly_across(delta)

# ─── MODE A: CONFRONTATION ───

func _do_fly_in(delta: float) -> void:
	position.x -= fly_speed * delta
	# Gentle vertical sine during approach
	position.y = _base_y + sin(_time * 2.0) * 10.0
	if position.x <= FLY_IN_TARGET_X and not _scroll_stop_emitted:
		_enter_hover()

func _enter_hover() -> void:
	state = State.HOVER
	_hover_timer = HOVER_DURATION
	_scroll_stop_emitted = true
	_base_y = position.y  # Lock hover base at current y
	request_scroll_stop.emit()
	# Level out slightly during hover
	var tween = create_tween()
	tween.tween_property(sprite, "rotation", SUPERMAN_TILT * 0.3, 0.3)

func _do_hover(delta: float) -> void:
	_hover_timer -= delta
	# Menacing bob
	position.y = _base_y + sin(_time * HOVER_BOB_FREQ) * HOVER_BOB_AMP
	if _hover_timer <= 0.0:
		state = State.ATTACK
		_attack_timer = 0.0  # Fire first sock immediately
		_attack_count = 0

func _do_attack(delta: float) -> void:
	# Continue bobbing during attack
	position.y = _base_y + sin(_time * HOVER_BOB_FREQ) * HOVER_BOB_AMP * 0.5
	_attack_timer -= delta
	if _attack_timer <= 0.0 and _attack_count < MAX_ATTACKS:
		_fire_sock()
		_attack_count += 1
		_attack_timer = ATTACK_INTERVAL
	if _attack_count >= MAX_ATTACKS and _attack_timer <= 0.0:
		_enter_fly_away()

func _fire_sock() -> void:
	if projectile_sock_scene == null:
		return
	var sock = projectile_sock_scene.instantiate()
	sock.global_position = global_position
	# Aim at Po's position (x=100, ground level ~y=288)
	# Arc: leftward + upward initial velocity, gravity brings it down
	var target_x = 100.0  # Po's locked x position
	var dx = target_x - global_position.x
	sock.vel = Vector2(dx * 0.6, -150.0)  # Arc toward Po
	# Add to main scene (not enemy, so it persists if enemy dies)
	get_tree().current_scene.add_child(sock)

func _enter_fly_away() -> void:
	state = State.FLY_AWAY
	request_scroll_resume.emit()
	# Tilt back to Superman angle for exit
	var tween = create_tween()
	tween.tween_property(sprite, "rotation", SUPERMAN_TILT, 0.2)

func _do_fly_away(delta: float) -> void:
	position.x -= FLY_AWAY_SPEED * delta
	# Slight upward drift as it exits
	position.y -= 30.0 * delta

# ─── MODE B: FLYBY ───

func _do_fly_across(delta: float) -> void:
	position.x -= FLYBY_SPEED * delta
	# Gentle sine to keep it alive-looking
	position.y = _base_y + sin(_time * 2.5) * 8.0

	# Drop debt bills as it passes over Po's x area
	_flyby_drop_timer -= delta
	if _flyby_drop_timer <= 0.0 and _flyby_drop_count < MAX_FLYBY_DROPS:
		# Drop when reasonably close to Po's x (100-300 range)
		if position.x < 350.0 and position.x > 50.0:
			_drop_bill()
			_flyby_drop_count += 1
			_flyby_drop_timer = FLYBY_DROP_INTERVAL

func _drop_bill() -> void:
	if projectile_bill_scene == null:
		return
	var bill = projectile_bill_scene.instantiate()
	bill.global_position = global_position + Vector2(0, 10)  # Drop from below Spidat
	# Bills fall downward with flutter (handled by projectile_bill.gd)
	get_tree().current_scene.add_child(bill)

# ─── DEFEAT ───

func _die() -> void:
	super._die()
	# Ensure world resumes if killed during confrontation
	if _scroll_stop_emitted:
		request_scroll_resume.emit()
