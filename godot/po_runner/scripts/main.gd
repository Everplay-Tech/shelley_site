extends Node2D
## Main game controller — ties together Po, obstacles, picks, narrative, and web bridge.
## Includes the Spirit Wisp System — ambient particles that make the world feel alive.
## The wisps react to gameplay: scatter on stumble, pulse toward Po on pick collection,
## slow and glow warm during narrative. The spirit world sees Po.

var distance := 0.0
var score := 0
var game_speed := 200.0
var state_timer := 0.0
const STATE_REPORT_INTERVAL := 2.0

# ============================================================
# SPIRIT WISP SYSTEM — Ambient World Spirits
# ============================================================
# Floating wisps that inhabit the Djinn World backdrop.
# They drift like living things — sine-wave float with unique phases.
# React to game events because the spirit world is watching Po.
const SPIRIT_COUNT := 16
const SPIRIT_DRIFT_SPEED_MIN := 8.0
const SPIRIT_DRIFT_SPEED_MAX := 25.0
const SPIRIT_SIZE_MIN := 1.5
const SPIRIT_SIZE_MAX := 4.5
const SPIRIT_COLOR_AMBIENT := Color(0.5, 0.75, 1.0, 0.10)    # Pale spirit blue
const SPIRIT_COLOR_NARRATIVE := Color(1.0, 0.82, 0.45, 0.16)  # Warm amber glow
const SPIRIT_COLOR_ALERT := Color(0.9, 0.3, 0.3, 0.25)        # Red flash on stumble
const SPIRIT_SCATTER_FORCE := 140.0
const SPIRIT_ATTRACT_SPEED := 80.0

var _spirits: Array[Dictionary] = []
var _spirit_mode := "ambient"  # "ambient", "narrative", "scatter", "attract"
var _spirit_mode_timer := 0.0
var _spirit_target_color := SPIRIT_COLOR_AMBIENT

@onready var po: CharacterBody2D = $Po
@onready var narrative: Node = $Narrative
@onready var web_bridge: Node = $WebBridge
@onready var obstacle_spawner: Node2D = $ObstacleSpawner
@onready var pick_spawner: Node2D = $PickSpawner
@onready var ground: ParallaxBackground = $Ground
@onready var score_label: Label = %ScoreLabel
@onready var distance_label: Label = %DistanceLabel

func _ready() -> void:
	# Connect signals
	po.pick_collected.connect(_on_pick_collected)
	po.stumbled.connect(_on_stumbled)
	narrative.narrative_started.connect(_on_narrative_started)
	narrative.narrative_ended.connect(_on_narrative_ended)
	narrative.onboarding_complete.connect(_on_onboarding_complete)
	web_bridge.host_command_received.connect(_on_host_command)

	# Tell the website we're ready
	web_bridge.send_game_ready()

	# Birth the spirit world
	_create_spirit_system()

func _process(delta: float) -> void:
	# Spirits always breathe — they don't stop for narrative or stumble
	_update_spirits(delta)

	if narrative.is_active or po.is_stumbling:
		return

	# Accumulate distance
	distance += game_speed * delta / 100.0  # Roughly meters
	distance_label.text = "%dm" % int(distance)

	# Check for narrative triggers
	narrative.check_distance(distance)

	# Periodically report state to website
	state_timer += delta
	if state_timer >= STATE_REPORT_INTERVAL:
		state_timer = 0.0
		web_bridge.send_player_state(po.current_action, score, po.current_action)

func _on_pick_collected(value: int) -> void:
	score += value
	score_label.text = str(score)
	# Spirits pulse toward Po — drawn to the energy of collection
	_attract_spirits()

func _on_stumbled() -> void:
	# Spirits scatter in shock — the world flinches when Po gets hit
	_scatter_spirits()

func _on_narrative_started(beat_id: String) -> void:
	po.enter_narrative()
	obstacle_spawner.pause_spawning()
	pick_spawner.pause_spawning()
	ground.set_narrative_mode(true)
	web_bridge.send_narrative_start(beat_id)
	# Spirits slow down and glow warm — listening to Po's story
	_spirit_mode = "narrative"
	_spirit_target_color = SPIRIT_COLOR_NARRATIVE

func _on_narrative_ended(beat_id: String) -> void:
	po.exit_narrative()
	obstacle_spawner.resume_spawning()
	pick_spawner.resume_spawning()
	ground.set_narrative_mode(false)
	web_bridge.send_narrative_end(beat_id)
	# Spirits return to ambient — back to the drift
	_spirit_mode = "ambient"
	_spirit_target_color = SPIRIT_COLOR_AMBIENT

func _on_onboarding_complete() -> void:
	web_bridge.send_onboarding_complete()

func _on_host_command(command: String, _data: Dictionary) -> void:
	match command:
		"start":
			pass  # Game starts automatically
		"pause":
			get_tree().paused = true
		"resume":
			get_tree().paused = false

# ============================================================
# SPIRIT WISP SYSTEM — The World Breathes
# ============================================================

func _create_spirit_system() -> void:
	var vp_size = get_viewport().get_visible_rect().size
	for i in range(SPIRIT_COUNT):
		var spirit = ColorRect.new()
		var size = randf_range(SPIRIT_SIZE_MIN, SPIRIT_SIZE_MAX)
		spirit.size = Vector2(size, size)
		spirit.color = SPIRIT_COLOR_AMBIENT
		spirit.z_index = 5  # Between background and Po
		# Scatter across the viewport
		spirit.position = Vector2(
			randf_range(0, vp_size.x),
			randf_range(30, vp_size.y - 50)
		)
		# Round spirits: slightly transparent edges via modulate
		add_child(spirit)
		_spirits.append({
			"node": spirit,
			"phase": randf_range(0.0, TAU),       # Unique sine offset
			"freq_x": randf_range(0.2, 0.6),      # Horizontal wave speed
			"freq_y": randf_range(0.4, 0.9),      # Vertical wave speed
			"amp_x": randf_range(3.0, 10.0),      # Horizontal wave size
			"amp_y": randf_range(5.0, 18.0),      # Vertical wave size
			"drift": randf_range(SPIRIT_DRIFT_SPEED_MIN, SPIRIT_DRIFT_SPEED_MAX),
			"base_alpha": randf_range(0.06, 0.14), # Individual brightness
			"velocity": Vector2.ZERO,              # For scatter/attract physics
			"pulse_timer": 0.0,                    # For temporary brightness
		})

func _update_spirits(delta: float) -> void:
	var vp_size = get_viewport().get_visible_rect().size
	var t = Time.get_ticks_msec() / 1000.0

	# Tick down mode timer
	if _spirit_mode_timer > 0:
		_spirit_mode_timer -= delta
		if _spirit_mode_timer <= 0:
			# Return to appropriate ambient state
			if narrative.is_active:
				_spirit_mode = "narrative"
				_spirit_target_color = SPIRIT_COLOR_NARRATIVE
			else:
				_spirit_mode = "ambient"
				_spirit_target_color = SPIRIT_COLOR_AMBIENT

	for s in _spirits:
		var node: ColorRect = s["node"]
		var phase: float = s["phase"]

		# Pulse timer (temporary brightness from events)
		if s["pulse_timer"] > 0:
			s["pulse_timer"] -= delta
			var pulse_alpha = s["base_alpha"] + 0.15 * (s["pulse_timer"] / 0.4)
			node.modulate.a = pulse_alpha
		else:
			# Gentle alpha breathing — each spirit has its own rhythm
			var breath = sin(t * s["freq_y"] * 0.5 + phase) * 0.03
			node.modulate.a = lerp(node.modulate.a, s["base_alpha"] + breath, delta * 3.0)

		match _spirit_mode:
			"scatter":
				# Fling outward with friction — the world recoils
				s["velocity"] *= (1.0 - 3.0 * delta)  # Drag
				node.position += s["velocity"] * delta
			"attract":
				# Drift toward Po — drawn to the pick energy
				var to_po = po.global_position - node.global_position
				var attract_dir = to_po.normalized()
				s["velocity"] = s["velocity"].lerp(
					attract_dir * SPIRIT_ATTRACT_SPEED, delta * 4.0)
				node.position += s["velocity"] * delta
				# Brighten as they approach
				s["pulse_timer"] = 0.3
			_:  # "ambient" or "narrative"
				var speed_mult = 0.25 if _spirit_mode == "narrative" else 1.0
				# Each spirit drifts left with the world, floating on sine waves
				var drift_x = -s["drift"] * speed_mult * delta
				var wave_x = cos(t * s["freq_x"] + phase) * s["amp_x"] * delta
				var wave_y = sin(t * s["freq_y"] + phase) * s["amp_y"] * delta
				node.position.x += drift_x + wave_x
				node.position.y += wave_y
				# Bleed off any residual velocity from scatter/attract
				s["velocity"] = s["velocity"].lerp(Vector2.ZERO, delta * 5.0)
				if s["velocity"].length() > 1.0:
					node.position += s["velocity"] * delta

		# Wrap around — spirits are eternal, they just cycle through
		if node.position.x < -15:
			node.position.x = vp_size.x + randf_range(5, 20)
			node.position.y = randf_range(30, vp_size.y - 50)
		elif node.position.x > vp_size.x + 25:
			node.position.x = -10
			node.position.y = randf_range(30, vp_size.y - 50)
		# Keep vertical in bounds
		node.position.y = clamp(node.position.y, 15, vp_size.y - 25)

		# Lerp color toward target — smooth transitions between modes
		node.color = node.color.lerp(_spirit_target_color, delta * 2.0)

func _scatter_spirits() -> void:
	_spirit_mode = "scatter"
	_spirit_mode_timer = 0.7  # Scatter for 0.7s, then return to ambient
	_spirit_target_color = SPIRIT_COLOR_ALERT
	for s in _spirits:
		# Each spirit flings away from Po — random force with radial bias
		var away = (s["node"].global_position - po.global_position)
		if away.length() < 1.0:
			away = Vector2(randf_range(-1, 1), randf_range(-1, 1))
		s["velocity"] = away.normalized() * SPIRIT_SCATTER_FORCE * randf_range(0.4, 1.6)

func _attract_spirits() -> void:
	_spirit_mode = "attract"
	_spirit_mode_timer = 0.35  # Brief pulse toward Po
	# Don't change target color — just pulse brightness via pulse_timer
	for s in _spirits:
		s["pulse_timer"] = 0.4
