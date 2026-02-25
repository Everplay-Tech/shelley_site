extends Node2D
## Spawns guitar enemies with time-based difficulty ramp.
## Spawn rate increases, HP scales. Boss every 60s.

signal enemy_defeated(points: int, position: Vector2)
signal powerup_dropped(pos: Vector2)
signal boss_defeated

@export var acoustic_scene: PackedScene
@export var electric_scene: PackedScene
@export var bass_scene: PackedScene
@export var boss_scene: PackedScene
@export var sound_wave_scene: PackedScene
@export var note_bomb_scene: PackedScene

const SPAWN_X := 680.0
const BASE_SPAWN_INTERVAL := 1.8
const MIN_SPAWN_INTERVAL := 0.5
const RAMP_RATE := 0.008  # Gets faster over time
const BOSS_INTERVAL := 60.0

var game_time := 0.0
var _spawn_timer := 0.0
var _boss_timer := 0.0
var _spawn_interval := BASE_SPAWN_INTERVAL
var active := false
var _boss_alive := false

func start() -> void:
	active = true
	game_time = 0.0
	_spawn_timer = 1.5  # Brief calm before first enemy
	_boss_timer = BOSS_INTERVAL

func stop() -> void:
	active = false

func _process(delta: float) -> void:
	if not active:
		return

	game_time += delta

	# Difficulty ramp — spawn interval decreases over time
	_spawn_interval = maxf(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL - game_time * RAMP_RATE)

	# Regular spawns
	_spawn_timer -= delta
	if _spawn_timer <= 0.0:
		_spawn_enemy()
		_spawn_timer = _spawn_interval + randf_range(-0.3, 0.3)

	# Boss timer
	if not _boss_alive:
		_boss_timer -= delta
		if _boss_timer <= 0.0:
			_spawn_boss()
			_boss_timer = BOSS_INTERVAL

func _spawn_enemy() -> void:
	var y = randf_range(50, 310)
	var enemy: Area2D

	# Enemy type weights shift with time
	var roll = randf()
	if game_time < 20:
		# First 20s: only acoustic
		enemy = _make_acoustic()
	elif game_time < 60:
		# 20-60s: acoustic + electric
		if roll < 0.6:
			enemy = _make_acoustic()
		else:
			enemy = _make_electric()
	else:
		# 60s+: all types
		if roll < 0.4:
			enemy = _make_acoustic()
		elif roll < 0.7:
			enemy = _make_electric()
		else:
			enemy = _make_bass()

	if enemy:
		enemy.position = Vector2(SPAWN_X, y)
		enemy.defeated.connect(_on_enemy_defeated)
		enemy.dropped_powerup.connect(_on_powerup_dropped)
		get_parent().add_child(enemy)

func _make_acoustic() -> Area2D:
	if not acoustic_scene:
		return null
	return acoustic_scene.instantiate()

func _make_electric() -> Area2D:
	if not electric_scene:
		return null
	var e = electric_scene.instantiate()
	e.sound_wave_scene = sound_wave_scene
	return e

func _make_bass() -> Area2D:
	if not bass_scene:
		return null
	var e = bass_scene.instantiate()
	e.note_bomb_scene = note_bomb_scene
	return e

func _spawn_boss() -> void:
	if not boss_scene:
		return
	_boss_alive = true
	var boss = boss_scene.instantiate()
	boss.position = Vector2(SPAWN_X + 40, 180)
	boss.sound_wave_scene = sound_wave_scene
	boss.defeated.connect(_on_enemy_defeated)
	boss.boss_defeated.connect(_on_boss_defeated)
	get_parent().add_child(boss)

func _on_enemy_defeated(pts: int, pos: Vector2) -> void:
	enemy_defeated.emit(pts, pos)

func _on_powerup_dropped(pos: Vector2) -> void:
	powerup_dropped.emit(pos)

func _on_boss_defeated() -> void:
	_boss_alive = false
	boss_defeated.emit()
