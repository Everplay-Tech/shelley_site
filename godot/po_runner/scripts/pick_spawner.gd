extends Node2D
## Spawns collectible picks at random intervals.
## Picks appear at varying heights — ground level and airborne.
## Each food item carries metadata: name, value, and whether it heals.

@export var spawn_interval_min := 2.0
@export var spawn_interval_max := 4.5
@export var pick_scene: PackedScene
@export var pickup_textures: Array[Texture2D] = []

# Food table: texture index maps to pickup_textures array order in main.tscn
# (ramen=0, strudel=1, coffee=2, cavatappi=3, blt=4, smoothie=5)
const FOOD_TABLE := [
	{"texture_idx": 0, "value": 1, "food_name": "ramen", "heals": false},
	{"texture_idx": 1, "value": 1, "food_name": "toaster_strudel", "heals": false},
	{"texture_idx": 2, "value": 1, "food_name": "coffee", "heals": true},
	{"texture_idx": 3, "value": 1, "food_name": "cavatappi", "heals": false},
	{"texture_idx": 4, "value": 1, "food_name": "blt", "heals": false},
	{"texture_idx": 5, "value": 1, "food_name": "smoothie", "heals": true},
]

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
	# Pick a random food entry and configure
	var food = FOOD_TABLE[randi() % FOOD_TABLE.size()]
	if pickup_textures.size() > food["texture_idx"]:
		var sprite = pick.get_node("Sprite2D")
		if sprite:
			sprite.texture = pickup_textures[food["texture_idx"]]
	pick.value = food["value"]
	pick.food_name = food["food_name"]
	pick.heals = food["heals"]
	# Random height — some on ground, some in air (reward jumping)
	var y_offsets = [0, -30, -60, -90]
	pick.position = Vector2(700, y_offsets[randi() % y_offsets.size()])
	add_child(pick)

func pause_spawning() -> void:
	is_paused = true

func resume_spawning() -> void:
	is_paused = false
