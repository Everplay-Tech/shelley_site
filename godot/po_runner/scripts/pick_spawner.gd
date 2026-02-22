extends Node2D
## Spawns collectible picks at random intervals.
## Picks appear at varying heights — ground level and airborne.

@export var spawn_interval_min := 2.0
@export var spawn_interval_max := 4.5
@export var pick_scene: PackedScene

var spawn_timer := 0.0
var next_spawn_time := 3.0
var is_paused := false

func _ready() -> void:
	next_spawn_time = randf_range(spawn_interval_min, spawn_interval_max)

func _process(delta: float) -> void:
	if is_paused:
		return
	spawn_timer += delta
	if spawn_timer >= next_spawn_time:
		spawn_timer = 0.0
		next_spawn_time = randf_range(spawn_interval_min, spawn_interval_max)
		_spawn_pick()

func _spawn_pick() -> void:
	if pick_scene == null:
		return
	var pick = pick_scene.instantiate()
	# Random height — some on ground, some in air (reward jumping)
	var y_offsets = [0, -30, -60, -90]
	pick.position = Vector2(700, y_offsets[randi() % y_offsets.size()])
	add_child(pick)

func pause_spawning() -> void:
	is_paused = true

func resume_spawning() -> void:
	is_paused = false
