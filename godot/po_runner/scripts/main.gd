extends Node2D
## Main game controller — ties together Po, obstacles, picks, narrative, and web bridge.
## Includes the Spirit Wisp System — ambient particles that make the world feel alive.
## The wisps react to gameplay: scatter on stumble, pulse toward Po on pick collection,
## slow and glow warm during narrative. The spirit world sees Po.

var distance := 0.0
var score := 0
var game_speed := 200.0
var state_timer := 0.0
var game_started := false
var _encounter_enemy: Area2D = null  # Active encounter enemy (scroll-stop)
const STATE_REPORT_INTERVAL := 2.0
var _ng_plus_mode := false

# Spirit Fist projectile scene (built in code — no .tscn needed)
const SpiritFistScript = preload("res://scripts/spirit_fist.gd")

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
const SPIRIT_COLOR_DEFEAT := Color(1.0, 0.95, 0.7, 0.20)  # Bright warm pulse on enemy defeat

var _spirits: Array[Dictionary] = []
var _spirit_mode := "ambient"  # "ambient", "narrative", "scatter", "attract"
var _spirit_mode_timer := 0.0
var _spirit_target_color := SPIRIT_COLOR_AMBIENT

var is_game_over := false

# Persists across reload_current_scene() — allows auto-start on restart
static var _should_auto_start := false

@onready var po: CharacterBody2D = $Po
@onready var narrative: Node = $Narrative
@onready var web_bridge: Node = $WebBridge
@onready var obstacle_spawner: Node2D = $ObstacleSpawner
@onready var pick_spawner: Node2D = $PickSpawner
@onready var enemy_spawner: Node2D = $EnemySpawner
@onready var ground: ParallaxBackground = $Ground
@onready var hud: CanvasLayer = $HUD

func _ready() -> void:
	# Connect signals
	po.pick_collected.connect(_on_pick_collected)
	po.stumbled.connect(_on_stumbled)
	po.died.connect(_on_po_died)
	po.health_changed.connect(_on_health_changed)
	hud.restart_requested.connect(_on_restart)
	narrative.narrative_started.connect(_on_narrative_started)
	narrative.narrative_ended.connect(_on_narrative_ended)
	narrative.onboarding_complete.connect(_on_onboarding_complete)
	web_bridge.host_command_received.connect(_on_host_command)
	enemy_spawner.enemy_spawned.connect(_on_enemy_spawned)
	enemy_spawner.obstacle_spawner_ref = obstacle_spawner
	po.attack_fired.connect(_on_attack_fired)

	# Register attack1 input action (X key) if not already present
	if not InputMap.has_action("attack1"):
		InputMap.add_action("attack1")
		var ev = InputEventKey.new()
		ev.keycode = KEY_X
		InputMap.action_add_event("attack1", ev)

	# Birth the spirit world
	_create_spirit_system()

	# Check if this is a restart (scene was reloaded after game over)
	if _should_auto_start:
		_should_auto_start = false
		game_started = true
		po.start_running()
		ground.resume()
		obstacle_spawner.resume_spawning()
		pick_spawner.resume_spawning()
		enemy_spawner.resume_spawning()
		web_bridge.send_game_ready()
	else:
		# Start frozen — waiting for website "start" command
		ground.pause()
		obstacle_spawner.pause_spawning()
		pick_spawner.pause_spawning()
		enemy_spawner.pause_spawning()
		web_bridge.send_game_ready()

func _process(delta: float) -> void:
	# Spirits always breathe — ambiance even on welcome screen
	_update_spirits(delta)

	if not game_started or is_game_over:
		return

	# NG+ keyboard attack input (X key)
	if _ng_plus_mode:
		if Input.is_action_just_pressed("attack1"):
			po.attack_press()
		if Input.is_action_just_released("attack1"):
			po.attack_release()

	if narrative.is_active or po.is_stumbling:
		return

	# Don't accumulate distance during encounters (world is stopped)
	if _encounter_enemy != null:
		# Still feed distance to spawner so it doesn't reset
		enemy_spawner.distance_ref = distance
		return

	# Accumulate distance
	distance += game_speed * delta / 100.0  # Roughly meters
	hud.update_distance(int(distance))

	# Feed distance to enemy spawner
	enemy_spawner.distance_ref = distance

	# Check for narrative triggers
	narrative.check_distance(distance)

	# Periodically report state to website
	state_timer += delta
	if state_timer >= STATE_REPORT_INTERVAL:
		state_timer = 0.0
		web_bridge.send_player_state(po.current_action, score, po.current_action)

func _on_pick_collected(value: int, food_name: String) -> void:
	score += value
	hud.update_score(score)
	if food_name != "":
		hud.add_trophy(food_name)
	# Spirits pulse toward Po — drawn to the energy of collection
	_attract_spirits()

func _on_stumbled() -> void:
	# Spirits scatter in shock — the world flinches when Po gets hit
	_scatter_spirits()

func _on_health_changed(current: int, max_val: int) -> void:
	hud.update_hearts(current, max_val)

func _on_po_died() -> void:
	is_game_over = true
	# Freeze everything
	ground.pause()
	obstacle_spawner.pause_spawning()
	pick_spawner.pause_spawning()
	enemy_spawner.pause_spawning()
	_freeze_world_objects()
	# Clear encounter state so we don't double-resume later
	_encounter_enemy = null
	# Show game over UI
	hud.show_game_over(score, int(distance))
	# Report to website
	web_bridge.send_game_over(score, int(distance))
	# The spirit world mourns
	_scatter_spirits()

func _on_restart() -> void:
	_should_auto_start = true
	get_tree().reload_current_scene()

func _on_narrative_started(beat_id: String) -> void:
	po.enter_narrative()
	obstacle_spawner.pause_spawning()
	pick_spawner.pause_spawning()
	enemy_spawner.pause_spawning()
	ground.set_narrative_mode(true)
	web_bridge.send_narrative_start(beat_id)
	# Spirits slow down and glow warm — listening to Po's story
	_spirit_mode = "narrative"
	_spirit_target_color = SPIRIT_COLOR_NARRATIVE

func _on_narrative_ended(beat_id: String) -> void:
	po.exit_narrative()
	obstacle_spawner.resume_spawning()
	pick_spawner.resume_spawning()
	enemy_spawner.resume_spawning()
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
			if not game_started:
				# Check for NG+ mode
				var mode = _data.get("mode", "standard")
				if mode == "ng_plus":
					_ng_plus_mode = true
					po.activate_ng_plus()
				game_started = true
				po.start_running()
				ground.resume()
				obstacle_spawner.resume_spawning()
				pick_spawner.resume_spawning()
				enemy_spawner.resume_spawning()
		"pause":
			get_tree().paused = true
		"resume":
			get_tree().paused = false
		# Virtual input from mobile gameboy controls
		"jump_press":
			Input.action_press("jump")
		"jump_release":
			Input.action_release("jump")
		"slide_press":
			Input.action_press("slide")
		"slide_release":
			Input.action_release("slide")
		"advance_press":
			Input.action_press("advance")
		"advance_release":
			Input.action_release("advance")
		# NG+ attack virtual input
		"attack1_press":
			po.attack_press()
		"attack1_release":
			po.attack_release()

func _on_attack_fired(attack_type: String, spawn_pos: Vector2) -> void:
	if attack_type == "spirit_fist":
		var fist = Area2D.new()
		fist.set_script(SpiritFistScript)
		fist.global_position = spawn_pos
		fist.scroll_speed = game_speed
		# Set collision: layer 0 (none), mask layer 3 (enemies)
		fist.collision_layer = 0
		fist.collision_mask = 4  # Layer 3 = enemies
		add_child(fist)

func _on_enemy_spawned(enemy: Area2D) -> void:
	enemy.enemy_defeated.connect(_on_enemy_defeated)
	enemy.enemy_hit_po.connect(_on_enemy_hit_po)
	# Encounter signals — enemies can request scroll-stop for dramatic face-offs
	enemy.request_scroll_stop.connect(_on_enemy_request_scroll_stop.bind(enemy))
	enemy.request_scroll_resume.connect(_on_enemy_request_scroll_resume)

func _on_enemy_defeated(enemy_type: String, pos: Vector2) -> void:
	score += 3
	hud.update_score(score)
	# Spirits pulse bright — the world celebrates a victory
	_spirit_mode = "attract"
	_spirit_mode_timer = 0.5
	_spirit_target_color = SPIRIT_COLOR_DEFEAT
	for s in _spirits:
		s["pulse_timer"] = 0.5

func _on_enemy_hit_po(_enemy_type: String) -> void:
	# Enemy hit is handled by the enemy's body_entered → po.stumble()
	# Spirits scatter same as obstacle stumble
	_scatter_spirits()

# ============================================================
# ENCOUNTER SYSTEM — Scroll-Stop Face-Offs
# ============================================================
# Enemies can request the world to stop scrolling for dramatic encounters.
# All "world_scrollable" objects freeze. World resumes when encounter ends.
# Safety net: if encounter enemy dies/freed, world auto-resumes.

func _on_enemy_request_scroll_stop(enemy: Area2D) -> void:
	if _encounter_enemy != null:
		return  # Already in an encounter — ignore
	_encounter_enemy = enemy
	enemy.tree_exiting.connect(_on_encounter_enemy_exiting, CONNECT_ONE_SHOT)
	ground.pause()
	obstacle_spawner.pause_spawning()
	pick_spawner.pause_spawning()
	enemy_spawner.pause_spawning()
	_freeze_world_objects()

func _on_enemy_request_scroll_resume() -> void:
	if _encounter_enemy == null:
		return  # No active encounter — nothing to resume
	_encounter_enemy = null
	ground.resume()
	obstacle_spawner.resume_spawning()
	pick_spawner.resume_spawning()
	enemy_spawner.resume_spawning()
	_unfreeze_world_objects()

func _on_encounter_enemy_exiting() -> void:
	# Safety net — if encounter enemy dies/freed, resume world
	if _encounter_enemy != null:
		_on_enemy_request_scroll_resume()

func _freeze_world_objects() -> void:
	## Stop all world-scrollable objects (enemies, obstacles, picks)
	for node in get_tree().get_nodes_in_group("world_scrollable"):
		if "scroll_speed" in node:
			node.scroll_speed = 0.0

func _unfreeze_world_objects() -> void:
	## Restore scroll speed on all world-scrollable objects
	for node in get_tree().get_nodes_in_group("world_scrollable"):
		if "scroll_speed" in node:
			node.scroll_speed = game_speed

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
