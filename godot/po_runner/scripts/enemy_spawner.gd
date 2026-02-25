extends Node2D
## Smart enemy spawner — distance-gated difficulty, weighted random enemy selection.
## Mantigre from 75m (~38s), Spidat introduced at 200m (~100s).
## Prevents spawn conflicts with ObstacleSpawner.

signal enemy_spawned(enemy: Area2D)

@export var mantigre_scene: PackedScene
@export var spidat_scene: PackedScene
@export var obstacle_spawner_ref: Node2D  # Set in main.tscn or main.gd
@export var initial_spawn_interval := 5.0
@export var min_spawn_interval := 2.0
@export var ramp_rate := 0.002  # Interval decreases per meter
@export var min_distance := 75.0  # Enemies at ~38s into gameplay

var spawn_timer := 0.0
var next_spawn_time := 10.0
var current_interval := 8.0
var is_paused := false
var distance_ref := 0.0  # Updated by main.gd each frame

func _ready() -> void:
	next_spawn_time = initial_spawn_interval  # First spawn at normal interval

func _process(delta: float) -> void:
	if is_paused or distance_ref < min_distance:
		return

	# Difficulty ramp — spawn faster over distance
	current_interval = max(min_spawn_interval,
		initial_spawn_interval - (distance_ref - min_distance) * ramp_rate)

	spawn_timer += delta
	if spawn_timer >= next_spawn_time:
		spawn_timer = 0.0
		next_spawn_time = randf_range(current_interval * 0.8, current_interval * 1.2)
		_try_spawn()

func _try_spawn() -> void:
	# Conflict check: don't spawn if an obstacle just spawned nearby
	if obstacle_spawner_ref:
		for child in obstacle_spawner_ref.get_children():
			if child is StaticBody2D and child.position.x > 500:
				# Too close to a recent obstacle — delay
				spawn_timer = -0.5  # Retry in 0.5s
				return

	# Pick enemy type based on distance
	var enemy: Area2D
	if distance_ref < 200.0:
		# Only Mantigre for early enemies
		enemy = _spawn_mantigre()
	else:
		# Mix: 60% Mantigre, 40% Spidat
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
	e.position = Vector2(700, 0)  # Ground level (spawner is at y=308)
	return e

func _spawn_spidat() -> Area2D:
	if spidat_scene == null:
		return null
	var e = spidat_scene.instantiate()
	# Air position — above ground, in Po's jump space
	e.position = Vector2(700, randf_range(-70, -50))
	return e

func pause_spawning() -> void:
	is_paused = true

func resume_spawning() -> void:
	is_paused = false
