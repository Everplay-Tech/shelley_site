extends Node2D
## Smart enemy spawner — distance-gated difficulty, weighted random enemy selection.
## BOSS SCHEDULE: 6 initial scroll-stop encounters, then rolling bosses every 300m.
## Pieces drop with RNG (70%) + pity counter — player may need more than 6 bosses.
## Regular enemies still spawn between bosses for challenge.
## Prevents spawn conflicts with ObstacleSpawner.
## Passes projectile scenes to Spidat for its attack modes.
##
## Rizky: Add new enemy types by adding @export PackedScene + spawn func.
## The pattern is always: instantiate → configure → position → return.

signal enemy_spawned(enemy: Area2D)

@export var mantigre_scene: PackedScene
@export var spidat_scene: PackedScene
@export var projectile_sock_scene: PackedScene
@export var projectile_bill_scene: PackedScene
@export var shockwave_scene: PackedScene
@export var sonar_ring_scene: PackedScene
@export var projectile_web_scene: PackedScene
@export var obstacle_spawner_ref: Node2D  # Set in main.tscn or main.gd
@export var initial_spawn_interval := 5.0
@export var min_spawn_interval := 2.0
@export var ramp_rate := 0.002  # Interval decreases per meter
@export var min_distance := 75.0  # Regular enemies start at ~38s into gameplay

var spawn_timer := 0.0
var next_spawn_time := 10.0
var current_interval := 8.0
var is_paused := false
var distance_ref := 0.0  # Updated by main.gd each frame

# ---- Boss Schedule (Forbidden Six encounters) ----
# 6 initial boss encounters at fixed distances. Drops are RNG (70% + pity in main.gd).
# After these 6, rolling bosses spawn every 300m until player has all 6 pieces.
# Boss type: "mantigre", "spidat", "mantigre_v2", "spidat_v2", "duo", "final"
var _boss_schedule := [
	{"distance": 400.0, "type": "mantigre", "spawned": false},
	{"distance": 800.0, "type": "spidat", "spawned": false},
	{"distance": 1200.0, "type": "mantigre_v2", "spawned": false},
	{"distance": 1500.0, "type": "spidat_v2", "spawned": false},
	{"distance": 1800.0, "type": "duo", "spawned": false},
	{"distance": 2100.0, "type": "final", "spawned": false},
]
var _next_boss_idx := 0

# Rolling bosses: after initial schedule, keep spawning every ROLLING_INTERVAL meters
const ROLLING_BOSS_INTERVAL := 300.0
var _last_rolling_boss_dist := 0.0
var _rolling_boss_count := 0

# Buffer distance: suppress regular enemies within N meters of a boss trigger
const BOSS_SUPPRESS_RANGE := 80.0

func _ready() -> void:
	next_spawn_time = initial_spawn_interval

func _process(delta: float) -> void:
	if is_paused:
		return

	# Check boss schedule first (priority over regular spawns)
	_check_boss_schedule()

	# Regular enemy spawning (suppressed near boss triggers)
	if distance_ref < min_distance or _is_near_boss_trigger():
		return

	# Difficulty ramp — spawn faster over distance
	current_interval = max(min_spawn_interval,
		initial_spawn_interval - (distance_ref - min_distance) * ramp_rate)

	spawn_timer += delta
	if spawn_timer >= next_spawn_time:
		spawn_timer = 0.0
		next_spawn_time = randf_range(current_interval * 0.8, current_interval * 1.2)
		_try_spawn()

func _is_near_boss_trigger() -> bool:
	## Suppress regular enemies near upcoming boss encounters.
	if _next_boss_idx < _boss_schedule.size():
		var boss_dist = _boss_schedule[_next_boss_idx]["distance"]
		return abs(distance_ref - boss_dist) < BOSS_SUPPRESS_RANGE
	# Rolling boss suppression
	if _last_rolling_boss_dist > 0.0:
		var next_rolling = _last_rolling_boss_dist + ROLLING_BOSS_INTERVAL
		return abs(distance_ref - next_rolling) < BOSS_SUPPRESS_RANGE
	return false

func _check_boss_schedule() -> void:
	# Phase 1: Fixed schedule (initial 6 encounters)
	if _next_boss_idx < _boss_schedule.size():
		var boss = _boss_schedule[_next_boss_idx]
		if not boss["spawned"] and distance_ref >= boss["distance"]:
			boss["spawned"] = true
			_spawn_boss(boss["type"])
			_next_boss_idx += 1
		return

	# Phase 2: Rolling bosses — every 300m after schedule exhausted
	if _last_rolling_boss_dist == 0.0:
		_last_rolling_boss_dist = _boss_schedule[-1]["distance"]
	var next_dist = _last_rolling_boss_dist + ROLLING_BOSS_INTERVAL
	if distance_ref >= next_dist:
		_last_rolling_boss_dist = next_dist
		_rolling_boss_count += 1
		# Alternate Mantigre/Spidat, escalating speed
		if _rolling_boss_count % 2 == 1:
			var enemy = _spawn_mantigre()
			if enemy:
				enemy.approach_speed = 120.0 + _rolling_boss_count * 5.0
				add_child(enemy)
				enemy_spawned.emit(enemy)
		else:
			var enemy = _spawn_spidat_confrontation()
			if enemy:
				add_child(enemy)
				enemy_spawned.emit(enemy)

func _spawn_boss(boss_type: String) -> void:
	## Spawn a guaranteed scroll-stop boss encounter.
	var enemy: Area2D = null
	match boss_type:
		"mantigre", "mantigre_v2":
			enemy = _spawn_mantigre()
			if enemy and boss_type == "mantigre_v2":
				# Harder variant: faster approach, shorter confront time
				enemy.approach_speed = 120.0
		"spidat", "spidat_v2":
			enemy = _spawn_spidat_confrontation()
		"duo":
			# Mantigre + Spidat at the same time
			var m = _spawn_mantigre()
			if m:
				add_child(m)
				enemy_spawned.emit(m)
			enemy = _spawn_spidat_confrontation()
		"final":
			# Final boss — Mantigre with extra aggression
			enemy = _spawn_mantigre()
			if enemy:
				enemy.approach_speed = 140.0

	if enemy:
		add_child(enemy)
		enemy_spawned.emit(enemy)

func _try_spawn() -> void:
	# Conflict check: don't spawn if an obstacle just spawned nearby
	if obstacle_spawner_ref:
		for child in obstacle_spawner_ref.get_children():
			if child is StaticBody2D and child.position.x > 500:
				spawn_timer = -0.5
				return

	# Pick enemy type based on distance (regular non-boss enemies)
	var enemy: Area2D
	if distance_ref < 200.0:
		enemy = _spawn_mantigre()
	else:
		if randf() < 0.6:
			enemy = _spawn_mantigre()
		else:
			enemy = _spawn_spidat()

	if enemy:
		add_child(enemy)
		enemy_spawned.emit(enemy)

func _spawn_mantigre() -> Area2D:
	if mantigre_scene == null:
		return null
	var e = mantigre_scene.instantiate()
	e.shockwave_scene = shockwave_scene
	e.position = Vector2(700, 0)
	return e

func _spawn_spidat() -> Area2D:
	if spidat_scene == null:
		return null
	var e = spidat_scene.instantiate()
	e.mode = e.Mode.FLYBY if randf() < 0.5 else e.Mode.CONFRONTATION
	e.projectile_sock_scene = projectile_sock_scene
	e.projectile_bill_scene = projectile_bill_scene
	e.sonar_ring_scene = sonar_ring_scene
	e.projectile_web_scene = projectile_web_scene
	e.position = Vector2(700, randf_range(-70, -40))
	return e

func _spawn_spidat_confrontation() -> Area2D:
	## Always-confrontation Spidat for boss encounters.
	if spidat_scene == null:
		return null
	var e = spidat_scene.instantiate()
	e.mode = e.Mode.CONFRONTATION
	e.projectile_sock_scene = projectile_sock_scene
	e.projectile_bill_scene = projectile_bill_scene
	e.sonar_ring_scene = sonar_ring_scene
	e.projectile_web_scene = projectile_web_scene
	e.position = Vector2(700, randf_range(-70, -40))
	return e

func pause_spawning() -> void:
	is_paused = true

func resume_spawning() -> void:
	is_paused = false
