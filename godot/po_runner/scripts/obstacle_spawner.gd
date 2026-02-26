extends Node2D
## Spawns obstacles at random intervals. Obstacles scroll left with the world.
## Tuned for fair spacing — no cluster spawns, wider gaps for readability.

@export var spawn_interval_min := 2.0
@export var spawn_interval_max := 4.0
@export var obstacle_scene: PackedScene

var spawn_timer := 0.0
var next_spawn_time := 2.5
var is_paused := false

# Minimum pixel gap between obstacles on screen (prevents wall-of-blocks feel)
const MIN_GAP_PX := 180.0

func _ready() -> void:
	next_spawn_time = randf_range(spawn_interval_min, spawn_interval_max)

func _process(delta: float) -> void:
	if is_paused:
		return

	spawn_timer += delta
	if spawn_timer >= next_spawn_time:
		spawn_timer = 0.0
		next_spawn_time = randf_range(spawn_interval_min, spawn_interval_max)
		_spawn_obstacle()

func _spawn_obstacle() -> void:
	if obstacle_scene == null:
		return
	# Enforce minimum gap — skip spawn if any obstacle is still near the spawn edge
	for child in get_children():
		if child is StaticBody2D and child.position.x > (700.0 - MIN_GAP_PX):
			return
	var obstacle = obstacle_scene.instantiate()
	obstacle.position = Vector2(700, 0)  # Spawn off-screen right
	add_child(obstacle)

func pause_spawning() -> void:
	is_paused = true

func resume_spawning() -> void:
	is_paused = false
