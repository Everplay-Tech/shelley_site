extends Node2D
## Librarynth player — grid-based movement with smooth lerp.
## Scholar navigating the magical library maze.

signal item_collected(cell_type: int, grid_pos: Vector2i)
signal key_collected(grid_pos: Vector2i)
signal door_blocked(grid_pos: Vector2i)
signal push_requested(block_pos: Vector2i, direction: Vector2i)
signal room_exit_reached(exit_pos: Vector2i)
signal exit_reached()

const CELL_SIZE := 20
const HUD_HEIGHT := 24
const MOVE_DURATION := 0.08
const DAS_DELAY := 0.15
const DAS_RATE := 0.05
const HIT_INVINCIBILITY := 1.0

# Cell type enum (matches main.gd)
const C_FLOOR := 0
const C_WALL := 1
const C_DOOR_LOCKED := 2
const C_DOOR_OPEN := 3
const C_ITEM_SCROLL := 4
const C_ITEM_NOTE := 5
const C_KEY := 6
const C_SWITCH := 7
const C_PUSH_BLOCK := 8
const C_EXIT := 10
const C_ENTRANCE := 11

var grid_pos := Vector2i.ZERO
var target_pos := Vector2i.ZERO
var keys_held := 0
var room_data: Array = []
var room_cols := 32
var room_rows := 16

var _is_moving := false
var _move_from := Vector2.ZERO
var _move_to := Vector2.ZERO
var _move_progress := 0.0
var _facing := Vector2i(0, 1)
var _invincible := false
var _invincible_timer := 0.0
var _blink_timer := 0.0

# DAS per direction
var _das_timers := {"up": 0.0, "down": 0.0, "left": 0.0, "right": 0.0}
var _das_active := {"up": false, "down": false, "left": false, "right": false}

# Visuals
var _body: ColorRect
var _inner: ColorRect
var _key_dot: ColorRect
var _dir_indicator: ColorRect
var _bob_time := 0.0

# Push block positions — set by main.gd
var push_block_positions: Array = []

func _ready() -> void:
	_build_visuals()

func _build_visuals() -> void:
	# Body: cyan/blue scholar robe
	_body = ColorRect.new()
	_body.size = Vector2(16, 16)
	_body.position = Vector2(2, 2)
	_body.color = Color(0.25, 0.4, 0.7, 1.0)
	add_child(_body)
	# Inner robe detail
	_inner = ColorRect.new()
	_inner.size = Vector2(10, 10)
	_inner.position = Vector2(3, 3)
	_inner.color = Color(0.35, 0.55, 0.85, 1.0)
	_body.add_child(_inner)
	# Direction indicator (small triangle-like rect)
	_dir_indicator = ColorRect.new()
	_dir_indicator.size = Vector2(4, 4)
	_dir_indicator.position = Vector2(6, -2)  # Above by default (facing up)
	_dir_indicator.color = Color(0.5, 0.7, 1.0, 0.8)
	_body.add_child(_dir_indicator)
	# Key indicator (hidden initially)
	_key_dot = ColorRect.new()
	_key_dot.size = Vector2(4, 4)
	_key_dot.position = Vector2(-5, 6)
	_key_dot.color = Color(1.0, 0.85, 0.0, 1.0)
	_key_dot.visible = false
	_body.add_child(_key_dot)

func _process(delta: float) -> void:
	if _invincible:
		_invincible_timer -= delta
		_blink_timer += delta
		_body.visible = int(_blink_timer * 12.0) % 2 == 0
		if _invincible_timer <= 0.0:
			_invincible = false
			_invincible_timer = 0.0
			_blink_timer = 0.0
			_body.visible = true

	if _is_moving:
		_move_progress += delta / MOVE_DURATION
		if _move_progress >= 1.0:
			_move_progress = 1.0
			_is_moving = false
			grid_pos = target_pos
		position = _move_from.lerp(_move_to, minf(_move_progress, 1.0))
	else:
		_handle_input(delta)
		_bob_time += delta
		_body.position.y = 2.0 + sin(_bob_time * 3.0) * 1.0

	_update_direction_indicator()

func _handle_input(delta: float) -> void:
	var dirs := {
		"up": Vector2i(0, -1),
		"down": Vector2i(0, 1),
		"left": Vector2i(-1, 0),
		"right": Vector2i(1, 0),
	}
	var actions := {
		"up": "move_up",
		"down": "move_down",
		"left": "move_left",
		"right": "move_right",
	}
	for dir_name in dirs:
		var action: String = actions[dir_name]
		var dir: Vector2i = dirs[dir_name]
		if Input.is_action_just_pressed(action):
			_try_grid_move(dir)
			_das_timers[dir_name] = 0.0
			_das_active[dir_name] = false
		elif Input.is_action_pressed(action):
			_das_timers[dir_name] += delta
			if not _das_active[dir_name]:
				if _das_timers[dir_name] >= DAS_DELAY:
					_das_active[dir_name] = true
					_das_timers[dir_name] = 0.0
			else:
				if _das_timers[dir_name] >= DAS_RATE:
					_das_timers[dir_name] = 0.0
					_try_grid_move(dir)
		else:
			_das_timers[dir_name] = 0.0
			_das_active[dir_name] = false

func _try_grid_move(dir: Vector2i) -> void:
	if _is_moving:
		return
	_facing = dir
	var new_pos := grid_pos + dir
	# Bounds check — room exit
	if new_pos.x < 0 or new_pos.x >= room_cols or new_pos.y < 0 or new_pos.y >= room_rows:
		room_exit_reached.emit(new_pos)
		return
	var cell: int = room_data[new_pos.y][new_pos.x]
	match cell:
		C_WALL:
			return  # Blocked
		C_DOOR_LOCKED:
			if keys_held > 0:
				keys_held -= 1
				_key_dot.visible = keys_held > 0
				# Main.gd will handle unlocking the door
				door_blocked.emit(new_pos)  # Reused signal — main checks keys
			else:
				door_blocked.emit(new_pos)
			return
		C_EXIT:
			_start_move(new_pos)
			exit_reached.emit()
			return
		C_KEY:
			keys_held += 1
			_key_dot.visible = true
			key_collected.emit(new_pos)
			_start_move(new_pos)
			return
		C_ITEM_SCROLL, C_ITEM_NOTE:
			item_collected.emit(cell, new_pos)
			_start_move(new_pos)
			return
		_:
			pass
	# Check push blocks
	for b in push_block_positions:
		if b == new_pos:
			push_requested.emit(new_pos, dir)
			return
	# Floor, open door, switch, entrance — all walkable
	_start_move(new_pos)

func _start_move(new_pos: Vector2i) -> void:
	target_pos = new_pos
	_is_moving = true
	_move_progress = 0.0
	_move_from = position
	_move_to = _grid_to_pixel(new_pos)

func _grid_to_pixel(gpos: Vector2i) -> Vector2:
	return Vector2(gpos.x * CELL_SIZE, gpos.y * CELL_SIZE + HUD_HEIGHT)

func set_grid_pos(gpos: Vector2i) -> void:
	grid_pos = gpos
	target_pos = gpos
	_is_moving = false
	position = _grid_to_pixel(gpos)

func hit_by_hazard() -> void:
	if _invincible:
		return
	_invincible = true
	_invincible_timer = HIT_INVINCIBILITY
	_blink_timer = 0.0

func _update_direction_indicator() -> void:
	match _facing:
		Vector2i(0, -1):  # Up
			_dir_indicator.position = Vector2(6, -2)
		Vector2i(0, 1):   # Down
			_dir_indicator.position = Vector2(6, 14)
		Vector2i(-1, 0):  # Left
			_dir_indicator.position = Vector2(-2, 6)
		Vector2i(1, 0):   # Right
			_dir_indicator.position = Vector2(14, 6)

func _unhandled_input(event: InputEvent) -> void:
	# Touch: tap direction relative to player
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if _is_moving:
			return
		var touch_pos: Vector2 = event.position
		var player_center := position + Vector2(CELL_SIZE / 2.0, CELL_SIZE / 2.0)
		var diff := touch_pos - player_center
		if absf(diff.x) > absf(diff.y):
			_try_grid_move(Vector2i(1, 0) if diff.x > 0 else Vector2i(-1, 0))
		else:
			_try_grid_move(Vector2i(0, 1) if diff.y > 0 else Vector2i(0, -1))
