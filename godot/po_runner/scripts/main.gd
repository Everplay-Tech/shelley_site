extends Node2D
## Main game controller — ties together Po, obstacles, picks, narrative, and web bridge.

var distance := 0.0
var score := 0
var game_speed := 200.0
var state_timer := 0.0
const STATE_REPORT_INTERVAL := 2.0

@onready var po: CharacterBody2D = $Po
@onready var narrative: Node = $Narrative
@onready var web_bridge: Node = $WebBridge
@onready var obstacle_spawner: Node2D = $ObstacleSpawner
@onready var pick_spawner: Node2D = $PickSpawner
@onready var ground: ParallaxBackground = $Ground
@onready var score_label: Label = %ScoreLabel
@onready var distance_label: Label = %DistanceLabel

func _ready() -> void:
	# === DEBUG: Code-created test rect (bypasses .tscn parsing) ===
	var test_rect = ColorRect.new()
	test_rect.size = Vector2(40, 60)
	test_rect.color = Color.RED
	test_rect.z_index = 100
	test_rect.position = Vector2(100, 230)
	add_child(test_rect)
	print("=== MAIN DEBUG ===")
	print("po node: ", po)
	print("po null? ", po == null)
	if po:
		print("po visible: ", po.visible)
		print("po global_pos: ", po.global_position)
		print("po z_index: ", po.z_index)
		print("po child count: ", po.get_child_count())
		for child in po.get_children():
			print("  child: ", child.name, " type: ", child.get_class(), " visible: ", child.visible if child is CanvasItem else "N/A")
	# === END DEBUG ===

	# Connect signals
	po.pick_collected.connect(_on_pick_collected)
	po.stumbled.connect(_on_stumbled)
	narrative.narrative_started.connect(_on_narrative_started)
	narrative.narrative_ended.connect(_on_narrative_ended)
	narrative.onboarding_complete.connect(_on_onboarding_complete)
	web_bridge.host_command_received.connect(_on_host_command)

	# Tell the website we're ready
	web_bridge.send_game_ready()

func _process(delta: float) -> void:
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

func _on_stumbled() -> void:
	# Brief pause on stumble — spawners keep going, adds pressure
	pass

func _on_narrative_started(beat_id: String) -> void:
	po.enter_narrative()
	obstacle_spawner.pause_spawning()
	pick_spawner.pause_spawning()
	ground.set_narrative_mode(true)
	web_bridge.send_narrative_start(beat_id)

func _on_narrative_ended(beat_id: String) -> void:
	po.exit_narrative()
	obstacle_spawner.resume_spawning()
	pick_spawner.resume_spawning()
	ground.set_narrative_mode(false)
	web_bridge.send_narrative_end(beat_id)

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
