extends Node2D
## Librarynth Quest — top-down Zelda dungeon maze zone game.
## Navigate 3 rooms of a magical library maze. Keys, push-blocks, hazards.
## 30-second zone game format with score emission.

# ─── Cell Types ──────────────────────────────────────────────────────────────
enum Cell { FLOOR, WALL, DOOR_LOCKED, DOOR_OPEN, ITEM_SCROLL, ITEM_NOTE,
			KEY, SWITCH, PUSH_BLOCK, HAZARD_PATH, EXIT, ENTRANCE }

# ─── Constants ───────────────────────────────────────────────────────────────
const CELL_SIZE := 20
const ROOM_COLS := 32
const ROOM_ROWS := 16
const HUD_HEIGHT := 24
const GAME_DURATION := 30.0
const WISP_COUNT := 12

# Scoring
const SCROLL_POINTS := 50
const NOTE_POINTS := 100
const ROOM_CLEAR_POINTS := 200
const EXIT_POINTS := 500
const TIME_BONUS_PER_SEC := 20
const ALL_ITEMS_BONUS := 300
const HAZARD_TIME_PENALTY := 2.0

# Colors (library theme)
const FLOOR_COLOR := Color(0.12, 0.10, 0.18, 1.0)
const WALL_COLOR := Color(0.35, 0.22, 0.12, 1.0)
const WALL_ACCENT := Color(0.45, 0.30, 0.15, 1.0)
const DOOR_LOCKED_COLOR := Color(0.7, 0.55, 0.1, 1.0)
const DOOR_OPEN_COLOR := Color(0.18, 0.15, 0.12, 0.5)
const SCROLL_COLOR := Color(0.85, 0.75, 0.5, 1.0)
const NOTE_COLOR := Color(0.7, 0.8, 1.0, 1.0)
const KEY_COLOR := Color(1.0, 0.85, 0.0, 1.0)
const SWITCH_OFF := Color(0.4, 0.35, 0.3, 1.0)
const SWITCH_ON := Color(0.3, 0.8, 0.3, 1.0)
const BLOCK_COLOR := Color(0.5, 0.4, 0.3, 1.0)
const EXIT_COLOR := Color(1.0, 0.75, 0.0, 0.8)
const HAZARD_COLOR := Color(0.6, 0.3, 0.8, 0.5)
const AMBER := Color(1.0, 0.75, 0.0)

# ─── Room Definitions ────────────────────────────────────────────────────────
# Legend: # wall, . floor, D locked door, d open door, s scroll, n note,
#         k key, S switch, B push block, E exit, > right exit, < left entrance

var ROOM_DEFS: Array = []

func _init_rooms() -> void:
	ROOM_DEFS = [
		# ── Room 1A: Reading Room (intro, key+door) ──────
		{
			"grid": [
				"################################",
				"#......#.........#..........s..#",
				"#......#.........#.............#",
				"#......#....##...#.............#",
				"#...........##...D.........k...#",
				"#...........#....#.............#",
				"#...####....#....#......########",
				"#..............s.#.............>",
				"#................#.............#",
				"#...####....#....#......########",
				"#...........#....#.............#",
				"#...........##...#.............#",
				"#......#....##...#.............#",
				"#......#.........#.............#",
				"<......#.........#.............#",
				"################################",
			],
			"entrance": Vector2i(0, 14),
			"exit_pos": Vector2i(31, 7),
			"exit_dir": "east",
			"hazards": [],
			"switch_links": {},
		},
		# ── Room 1B: Reading Room variant ────────────────
		{
			"grid": [
				"################################",
				"#..s...........#...............#",
				"#..............#...............#",
				"####...........#.....####......#",
				"#..............#........#......#",
				"#..............D........#..k...#",
				"#......#####...#........#......#",
				"<..............#...............>",
				"#..............#...............#",
				"#......#####...#........#......#",
				"#..............#........#......#",
				"#..............D........#......#",
				"####...........#.....####..s...#",
				"#..............#...............#",
				"#..............#...............#",
				"################################",
			],
			"entrance": Vector2i(0, 7),
			"exit_pos": Vector2i(31, 7),
			"exit_dir": "east",
			"hazards": [],
			"switch_links": {},
		},
		# ── Room 2A: Puzzle Chamber (push block + switch) ─
		{
			"grid": [
				"################################",
				"#..............#...............#",
				"#....s.........#.......n.......#",
				"#..............#...............#",
				"#.....####.....#....####.......#",
				"#..............#...............#",
				"#..............D...............#",
				"<..........B...#.....S.........>",
				"#..............#...............#",
				"#..............D...............#",
				"#.....####.....#....####.......#",
				"#..............#...............#",
				"#....s.........#...............#",
				"#..............#...............#",
				"#..............#...............#",
				"################################",
			],
			"entrance": Vector2i(0, 7),
			"exit_pos": Vector2i(31, 7),
			"exit_dir": "east",
			"hazards": [
				{"path": [Vector2i(3, 3), Vector2i(3, 4), Vector2i(3, 5), Vector2i(3, 6), Vector2i(3, 7), Vector2i(3, 8), Vector2i(3, 9), Vector2i(3, 10), Vector2i(3, 11), Vector2i(3, 12)]},
			],
			"switch_links": {Vector2i(21, 7): [Vector2i(15, 6), Vector2i(15, 9)]},
		},
		# ── Room 2B: Puzzle Chamber variant ──────────────
		{
			"grid": [
				"################################",
				"#..........#.......#...........#",
				"#..........#...s...#...........#",
				"#..........#.......#...........#",
				"#...####...#.......#...####....#",
				"#..........#.......D...........#",
				"#..........#.......#...........#",
				"<..........#...B...#.....S.....>",
				"#..........#.......#...........#",
				"#..........#.......D...........#",
				"#...####...#.......#...####....#",
				"#..........#..s....#.......n...#",
				"#..........#.......#...........#",
				"#..........#.......#...........#",
				"#..........#.......#...........#",
				"################################",
			],
			"entrance": Vector2i(0, 7),
			"exit_pos": Vector2i(31, 7),
			"exit_dir": "east",
			"hazards": [
				{"path": [Vector2i(5, 1), Vector2i(5, 2), Vector2i(5, 3), Vector2i(5, 4), Vector2i(5, 5), Vector2i(5, 6), Vector2i(5, 7)]},
			],
			"switch_links": {Vector2i(25, 7): [Vector2i(23, 5), Vector2i(23, 9)]},
		},
		# ── Room 3A: Exit Hall (maze, hazards, treasure) ─
		{
			"grid": [
				"################################",
				"#.....#........#.....#.........#",
				"#.....#...s....#.....#....n....#",
				"#.....#........#.....#.........#",
				"#.....#..###...#.....####......#",
				"#.....#........#...............#",
				"#.....#........#...............#",
				"<.....#........#.............E.#",
				"#.....#........#...............#",
				"#.....#........#...............#",
				"#.....#..###...#.....####......#",
				"#.....#........#.....#.........#",
				"#.s...#........#.....#....n....#",
				"#.....#........#.....#.........#",
				"#.....#........#.....#.........#",
				"################################",
			],
			"entrance": Vector2i(0, 7),
			"exit_pos": Vector2i(29, 7),
			"exit_dir": "none",
			"hazards": [
				{"path": [Vector2i(8, 1), Vector2i(8, 2), Vector2i(8, 3), Vector2i(8, 4), Vector2i(8, 5), Vector2i(8, 6), Vector2i(8, 7), Vector2i(8, 8), Vector2i(8, 9), Vector2i(8, 10), Vector2i(8, 11), Vector2i(8, 12), Vector2i(8, 13), Vector2i(8, 14)]},
				{"path": [Vector2i(22, 1), Vector2i(22, 2), Vector2i(22, 3), Vector2i(22, 4), Vector2i(22, 5), Vector2i(22, 6), Vector2i(22, 7), Vector2i(22, 8), Vector2i(22, 9), Vector2i(22, 10), Vector2i(22, 11), Vector2i(22, 12), Vector2i(22, 13), Vector2i(22, 14)]},
			],
			"switch_links": {},
		},
		# ── Room 3B: Exit Hall variant ───────────────────
		{
			"grid": [
				"################################",
				"#..#.......#.......#.......#...#",
				"#..#...n...#.......#.......#...#",
				"#..#.......#.......#.......#...#",
				"#..#.......#..####.#.......#...#",
				"#..#.......#.......#.......#...#",
				"#..........#.......#...........#",
				"<..........#.......#.........E.#",
				"#..........#.......#...........#",
				"#..#.......#.......#.......#...#",
				"#..#.......#..####.#.......#...#",
				"#..#...s...#.......#...s...#...#",
				"#..#.......#.......#.......#...#",
				"#..#.......#.......#.......#...#",
				"#..#.......#.......#.......#...#",
				"################################",
			],
			"entrance": Vector2i(0, 7),
			"exit_pos": Vector2i(29, 7),
			"exit_dir": "none",
			"hazards": [
				{"path": [Vector2i(4, 5), Vector2i(4, 6), Vector2i(4, 7), Vector2i(4, 8), Vector2i(4, 9)]},
				{"path": [Vector2i(24, 5), Vector2i(24, 6), Vector2i(24, 7), Vector2i(24, 8), Vector2i(24, 9)]},
			],
			"switch_links": {},
		},
	]

# ─── State ───────────────────────────────────────────────────────────────────
var _current_room_idx := 0
var _room_sequence: Array = []  # Indices into ROOM_DEFS
var _room_data: Array = []
var _cell_rects: Array = []
var _score := 0
var _rooms_cleared := 0
var _elapsed := 0.0
var _game_over := false
var _game_started := false
var _total_items := 0
var _items_collected := 0

var _hazards: Array = []
var _push_blocks: Array = []
var _switch_links: Dictionary = {}

var _player: Node2D
var _room_container: Node2D
var _entity_container: Node2D
var _vfx_container: Node2D
var _wisp_container: Node2D
var _hud: CanvasLayer
var _web_bridge: Node

var _score_label: Label
var _rooms_label: Label
var _key_label: Label
var _timer_bar: ColorRect
var _timer_bar_bg: ColorRect
var _game_over_label: Label

var _wisps: Array = []
var _exit_rects: Array = []
var _exit_beacon_timer := 0.0

# ─── Touch UI ──────────────────────────────────────────────────────────────
var _touch_btns: Dictionary = {}

# ─── Init ────────────────────────────────────────────────────────────────────

func _ready() -> void:
	_room_container = $RoomContainer
	_entity_container = $EntityContainer
	_vfx_container = $VFXContainer
	_wisp_container = $WispContainer
	_hud = $HUD
	_web_bridge = $WebBridge

	_init_rooms()
	_select_room_sequence()
	_build_hud()
	_build_touch_ui()
	_spawn_wisps()
	_spawn_player()
	_load_room(0)
	_game_started = true
	_web_bridge.send_game_ready()

func _select_room_sequence() -> void:
	# Pick one of each pair: [0 or 1], [2 or 3], [4 or 5]
	_room_sequence = [
		randi_range(0, 1),  # Room 1 variant
		randi_range(2, 3),  # Room 2 variant
		randi_range(4, 5),  # Room 3 variant
	]

func _spawn_player() -> void:
	_player = Node2D.new()
	_player.set_script(preload("res://scripts/player.gd"))
	_entity_container.add_child(_player)
	_player.z_index = 10
	_player.item_collected.connect(_on_item_collected)
	_player.key_collected.connect(_on_key_collected)
	_player.door_blocked.connect(_on_door_interact)
	_player.push_requested.connect(_on_push_requested)
	_player.room_exit_reached.connect(_on_room_exit)
	_player.exit_reached.connect(_on_exit_reached)

# ─── Room System ─────────────────────────────────────────────────────────────

func _load_room(seq_idx: int) -> void:
	_current_room_idx = seq_idx
	var room_def: Dictionary = ROOM_DEFS[_room_sequence[seq_idx]]

	_clear_room()
	_room_data = _parse_grid(room_def["grid"])
	_build_room_visuals()
	_spawn_items()
	_spawn_push_blocks_from_grid()
	_spawn_hazards(room_def)
	_switch_links = {}
	if room_def.has("switch_links"):
		for key in room_def["switch_links"]:
			_switch_links[key] = room_def["switch_links"][key]

	# Position player at entrance
	var entrance: Vector2i = room_def["entrance"]
	_player.set_grid_pos(entrance)
	_player.room_data = _room_data
	_sync_push_block_positions()

func _parse_grid(grid_strings: Array) -> Array:
	var grid: Array = []
	for row_str in grid_strings:
		var row: Array = []
		for i in range(row_str.length()):
			var c: String = row_str[i]
			match c:
				"#": row.append(Cell.WALL)
				".": row.append(Cell.FLOOR)
				"D": row.append(Cell.DOOR_LOCKED)
				"d": row.append(Cell.DOOR_OPEN)
				"s": row.append(Cell.ITEM_SCROLL)
				"n": row.append(Cell.ITEM_NOTE)
				"k": row.append(Cell.KEY)
				"S": row.append(Cell.SWITCH)
				"B": row.append(Cell.PUSH_BLOCK)
				"E": row.append(Cell.EXIT)
				"<": row.append(Cell.ENTRANCE)
				">": row.append(Cell.FLOOR)  # Exit doorway (right side)
				_: row.append(Cell.FLOOR)
		grid.append(row)
	return grid

func _build_room_visuals() -> void:
	_cell_rects.clear()
	_exit_rects.clear()
	for row in range(ROOM_ROWS):
		var row_rects: Array = []
		for col in range(ROOM_COLS):
			var cell: int = _room_data[row][col]
			var rect := ColorRect.new()
			rect.size = Vector2(CELL_SIZE, CELL_SIZE)
			rect.position = Vector2(col * CELL_SIZE, row * CELL_SIZE + HUD_HEIGHT)
			rect.color = _get_cell_color(cell)
			_room_container.add_child(rect)
			row_rects.append(rect)
			if cell == Cell.WALL:
				_add_bookshelf_detail(rect)
			elif cell == Cell.EXIT:
				_exit_rects.append(rect)
			elif cell == Cell.SWITCH:
				_add_switch_detail(rect)
		_cell_rects.append(row_rects)

func _get_cell_color(cell: int) -> Color:
	match cell:
		Cell.FLOOR, Cell.ENTRANCE, Cell.PUSH_BLOCK, Cell.HAZARD_PATH:
			return FLOOR_COLOR
		Cell.WALL:
			return WALL_COLOR
		Cell.DOOR_LOCKED:
			return DOOR_LOCKED_COLOR
		Cell.DOOR_OPEN:
			return DOOR_OPEN_COLOR
		Cell.ITEM_SCROLL, Cell.ITEM_NOTE, Cell.KEY:
			return FLOOR_COLOR
		Cell.SWITCH:
			return SWITCH_OFF
		Cell.EXIT:
			return EXIT_COLOR
		_:
			return FLOOR_COLOR

func _add_bookshelf_detail(rect: ColorRect) -> void:
	for i in range(3):
		var line := ColorRect.new()
		line.size = Vector2(CELL_SIZE - 4, 1)
		line.position = Vector2(2, 4 + i * 5)
		line.color = WALL_ACCENT
		rect.add_child(line)

func _add_switch_detail(rect: ColorRect) -> void:
	var inner := ColorRect.new()
	inner.size = Vector2(10, 10)
	inner.position = Vector2(5, 5)
	inner.color = Color(0.3, 0.28, 0.25, 1.0)
	rect.add_child(inner)

func _clear_room() -> void:
	for child in _room_container.get_children():
		child.queue_free()
	# Remove non-player entities
	for child in _entity_container.get_children():
		if child != _player:
			child.queue_free()
	for child in _vfx_container.get_children():
		child.queue_free()
	_cell_rects.clear()
	_hazards.clear()
	_push_blocks.clear()
	_exit_rects.clear()

# ─── Items ───────────────────────────────────────────────────────────────────

func _spawn_items() -> void:
	_total_items = 0
	_items_collected = 0
	for row in range(ROOM_ROWS):
		for col in range(ROOM_COLS):
			var cell: int = _room_data[row][col]
			if cell == Cell.ITEM_SCROLL:
				_spawn_item_visual(col, row, SCROLL_COLOR, Vector2(8, 8))
				_total_items += 1
			elif cell == Cell.ITEM_NOTE:
				_spawn_item_visual(col, row, NOTE_COLOR, Vector2(8, 10))
				_total_items += 1
			elif cell == Cell.KEY:
				_spawn_item_visual(col, row, KEY_COLOR, Vector2(6, 10))

func _spawn_item_visual(col: int, row: int, color: Color, item_size: Vector2) -> void:
	var item := ColorRect.new()
	item.size = item_size
	var px := col * CELL_SIZE + (CELL_SIZE - item_size.x) / 2.0
	var py := row * CELL_SIZE + HUD_HEIGHT + (CELL_SIZE - item_size.y) / 2.0
	item.position = Vector2(px, py)
	item.color = color
	item.set_meta("grid_pos", Vector2i(col, row))
	item.z_index = 2
	_room_container.add_child(item)
	# Bob animation
	var base_y: float = item.position.y
	var tween: Tween = item.create_tween().set_loops()
	tween.tween_property(item, "position:y", base_y - 2, 0.4)
	tween.tween_property(item, "position:y", base_y, 0.4)

func _remove_item_visual(grid_pos: Vector2i) -> void:
	for child in _room_container.get_children():
		if child.has_meta("grid_pos") and child.get_meta("grid_pos") == grid_pos:
			# Pop animation
			var tween: Tween = child.create_tween()
			tween.set_parallel(true)
			tween.tween_property(child, "scale", Vector2(1.5, 1.5), 0.15)
			tween.tween_property(child, "modulate:a", 0.0, 0.15)
			tween.chain().tween_callback(child.queue_free)
			break

# ─── Push Blocks ─────────────────────────────────────────────────────────────

func _spawn_push_blocks_from_grid() -> void:
	_push_blocks.clear()
	for row in range(ROOM_ROWS):
		for col in range(ROOM_COLS):
			if _room_data[row][col] == Cell.PUSH_BLOCK:
				var block := ColorRect.new()
				block.size = Vector2(CELL_SIZE - 2, CELL_SIZE - 2)
				block.position = Vector2(col * CELL_SIZE + 1, row * CELL_SIZE + HUD_HEIGHT + 1)
				block.color = BLOCK_COLOR
				block.z_index = 5
				var inner := ColorRect.new()
				inner.size = Vector2(CELL_SIZE - 8, CELL_SIZE - 8)
				inner.position = Vector2(3, 3)
				inner.color = Color(BLOCK_COLOR.r * 0.75, BLOCK_COLOR.g * 0.75, BLOCK_COLOR.b * 0.75)
				block.add_child(inner)
				_entity_container.add_child(block)
				_push_blocks.append({"node": block, "grid_pos": Vector2i(col, row)})
				_room_data[row][col] = Cell.FLOOR

func _sync_push_block_positions() -> void:
	var positions: Array = []
	for b in _push_blocks:
		positions.append(b["grid_pos"])
	_player.push_block_positions = positions

func _try_push_block(block_pos: Vector2i, direction: Vector2i) -> bool:
	var target := block_pos + direction
	if target.x < 0 or target.x >= ROOM_COLS or target.y < 0 or target.y >= ROOM_ROWS:
		return false
	var target_cell: int = _room_data[target.y][target.x]
	if target_cell != Cell.FLOOR and target_cell != Cell.SWITCH:
		return false
	# Check no other push block at target
	for b in _push_blocks:
		if b["grid_pos"] == target:
			return false
	# Move the block
	for b in _push_blocks:
		if b["grid_pos"] == block_pos:
			b["grid_pos"] = target
			var target_px := Vector2(target.x * CELL_SIZE + 1, target.y * CELL_SIZE + HUD_HEIGHT + 1)
			var tween: Tween = b["node"].create_tween()
			tween.tween_property(b["node"], "position", target_px, 0.1)
			# Check switch
			if target_cell == Cell.SWITCH:
				_activate_switch(target)
			_spawn_push_dust(block_pos, direction)
			_sync_push_block_positions()
			return true
	return false

func _activate_switch(switch_pos: Vector2i) -> void:
	_cell_rects[switch_pos.y][switch_pos.x].color = SWITCH_ON
	if _switch_links.has(switch_pos):
		var doors: Array = _switch_links[switch_pos]
		for door_pos in doors:
			var dp: Vector2i = door_pos
			_room_data[dp.y][dp.x] = Cell.DOOR_OPEN
			_cell_rects[dp.y][dp.x].color = DOOR_OPEN_COLOR
			_cell_rects[dp.y][dp.x].modulate = Color(2, 2, 2)
			var tween: Tween = _cell_rects[dp.y][dp.x].create_tween()
			tween.tween_property(_cell_rects[dp.y][dp.x], "modulate", Color.WHITE, 0.3)
		_player.room_data = _room_data
		_pulse_wisps(Color(0.3, 0.8, 0.3, 0.6))

func _spawn_push_dust(pos: Vector2i, dir: Vector2i) -> void:
	for i in range(4):
		var dust := ColorRect.new()
		var s: float = randf_range(2.0, 3.0)
		dust.size = Vector2(s, s)
		dust.position = Vector2(
			pos.x * CELL_SIZE + CELL_SIZE / 2.0,
			pos.y * CELL_SIZE + HUD_HEIGHT + CELL_SIZE / 2.0
		)
		dust.color = Color(0.5, 0.4, 0.3, 0.5)
		_vfx_container.add_child(dust)
		var angle: float = randf_range(-PI, PI)
		var dist: float = randf_range(8, 16)
		var target := dust.position + Vector2(cos(angle) * dist, sin(angle) * dist)
		var tween: Tween = dust.create_tween()
		tween.set_parallel(true)
		tween.tween_property(dust, "position", target, 0.3)
		tween.tween_property(dust, "color:a", 0.0, 0.3)
		tween.chain().tween_callback(dust.queue_free)

# ─── Hazards ─────────────────────────────────────────────────────────────────

func _spawn_hazards(room_def: Dictionary) -> void:
	_hazards.clear()
	if not room_def.has("hazards"):
		return
	for h_def in room_def["hazards"]:
		var path_arr: Array = h_def["path"]
		if path_arr.is_empty():
			continue
		var ghost := ColorRect.new()
		ghost.size = Vector2(12, 12)
		ghost.color = HAZARD_COLOR
		ghost.z_index = 8
		var start: Vector2i = path_arr[0]
		ghost.position = Vector2(start.x * CELL_SIZE + 4, start.y * CELL_SIZE + HUD_HEIGHT + 4)
		_entity_container.add_child(ghost)
		# Glow ring
		var glow := ColorRect.new()
		glow.size = Vector2(16, 16)
		glow.position = Vector2(-2, -2)
		glow.color = Color(HAZARD_COLOR.r, HAZARD_COLOR.g, HAZARD_COLOR.b, 0.15)
		glow.z_index = -1
		ghost.add_child(glow)
		_hazards.append({
			"node": ghost,
			"path": path_arr,
			"idx": 0,
			"forward": true,
			"timer": randf_range(0.0, 0.5),
		})

func _update_hazards(delta: float) -> void:
	var speed_mult := 1.0
	if _elapsed > 20.0:
		speed_mult = 1.5
	for h in _hazards:
		h["timer"] += delta * speed_mult
		if h["timer"] >= 0.5:
			h["timer"] = 0.0
			# Advance along path
			if h["forward"]:
				h["idx"] += 1
				if h["idx"] >= h["path"].size() - 1:
					h["forward"] = false
			else:
				h["idx"] -= 1
				if h["idx"] <= 0:
					h["forward"] = true
			var target_cell: Vector2i = h["path"][h["idx"]]
			var target_px := Vector2(target_cell.x * CELL_SIZE + 4, target_cell.y * CELL_SIZE + HUD_HEIGHT + 4)
			var tween: Tween = h["node"].create_tween()
			tween.tween_property(h["node"], "position", target_px, 0.3)
		# Alpha pulse
		h["node"].color.a = 0.35 + sin(_elapsed * 3.0) * 0.15
		# Collision
		var h_cell: Vector2i = h["path"][h["idx"]]
		if h_cell == _player.grid_pos or h_cell == _player.target_pos:
			if not _player._invincible:
				_on_hazard_hit()

func _on_hazard_hit() -> void:
	_elapsed = minf(_elapsed + HAZARD_TIME_PENALTY, GAME_DURATION)
	_player.hit_by_hazard()
	_flash_screen_edge()
	_pulse_wisps(Color(0.8, 0.2, 0.1, 0.7))
	# Hit freeze (MvC impact)
	Engine.time_scale = 0.1
	await get_tree().create_timer(0.04, true, false, true).timeout
	Engine.time_scale = 1.0
	# Screen shake
	var shake_tw: Tween = create_tween()
	for i in range(5):
		var intensity: float = 3.0 * (1.0 - float(i) / 5.0)
		shake_tw.tween_property(self, "position", Vector2(randf_range(-intensity, intensity), randf_range(-intensity * 0.5, intensity * 0.5)), 0.03)
	shake_tw.tween_property(self, "position", Vector2.ZERO, 0.05)

func _flash_screen_edge() -> void:
	var flash := ColorRect.new()
	flash.size = Vector2(640, 360)
	flash.color = Color(0.8, 0.1, 0.1, 0.25)
	flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud.add_child(flash)
	var tween: Tween = flash.create_tween()
	tween.tween_property(flash, "color:a", 0.0, 0.3)
	tween.tween_callback(flash.queue_free)

# ─── Player Signal Handlers ──────────────────────────────────────────────────

func _on_item_collected(cell_type: int, grid_pos: Vector2i) -> void:
	var points := 0
	if cell_type == Cell.ITEM_SCROLL:
		points = SCROLL_POINTS
		_pulse_wisps(Color(0.3, 0.4, 0.8, 0.6))
	elif cell_type == Cell.ITEM_NOTE:
		points = NOTE_POINTS
		_pulse_wisps(Color(0.7, 0.75, 0.85, 0.7))
	_score += points
	_items_collected += 1
	_room_data[grid_pos.y][grid_pos.x] = Cell.FLOOR
	_player.room_data = _room_data
	_remove_item_visual(grid_pos)
	# Overbright collection flash
	var flash := ColorRect.new()
	flash.size = Vector2(CELL_SIZE, CELL_SIZE)
	flash.position = Vector2(grid_pos.x * CELL_SIZE, grid_pos.y * CELL_SIZE + HUD_HEIGHT)
	flash.color = Color(3.0, 2.5, 1.5, 0.7)
	flash.z_index = 10
	_room_container.add_child(flash)
	var ft: Tween = flash.create_tween()
	ft.set_parallel(true)
	ft.tween_property(flash, "modulate:a", 0.0, 0.15)
	ft.tween_property(flash, "scale", Vector2(1.5, 1.5), 0.15)
	ft.chain().tween_callback(flash.queue_free)
	_score_label.text = str(_score)
	_spawn_score_popup(grid_pos, points)

func _on_key_collected(grid_pos: Vector2i) -> void:
	_room_data[grid_pos.y][grid_pos.x] = Cell.FLOOR
	_player.room_data = _room_data
	_remove_item_visual(grid_pos)
	_pulse_wisps(Color(1.0, 0.85, 0.0, 0.6))
	_key_label.text = "KEY x%d" % _player.keys_held
	_key_label.modulate = Color(2, 2, 1)
	var tween: Tween = _key_label.create_tween()
	tween.tween_property(_key_label, "modulate", Color.WHITE, 0.3)

func _on_door_interact(door_pos: Vector2i) -> void:
	if _player.keys_held >= 0:
		# Player already consumed a key in player.gd if they had one
		# Check if the door was just unlocked (keys_held was decremented)
		# We need to check: did the player have a key before this call?
		# The signal fires AFTER key consumption in player.gd
		# If door cell is still DOOR_LOCKED, player didn't have a key
		if _room_data[door_pos.y][door_pos.x] == Cell.DOOR_LOCKED:
			# Check if player just used a key (key count might have changed)
			# Actually, let's handle door unlocking here based on a simple check
			# The player.gd already decremented keys if they had one
			# We detect that by checking: did keys change? Simplification:
			# We'll unlock the door and let player walk next frame
			_room_data[door_pos.y][door_pos.x] = Cell.DOOR_OPEN
			_cell_rects[door_pos.y][door_pos.x].color = DOOR_OPEN_COLOR
			_cell_rects[door_pos.y][door_pos.x].modulate = Color(2, 2, 2)
			var tween: Tween = _cell_rects[door_pos.y][door_pos.x].create_tween()
			tween.tween_property(_cell_rects[door_pos.y][door_pos.x], "modulate", Color.WHITE, 0.3)
			# Golden burst on door unlock
			var door_world := Vector2(door_pos.x * CELL_SIZE + CELL_SIZE / 2.0, door_pos.y * CELL_SIZE + HUD_HEIGHT + CELL_SIZE / 2.0)
			for i in range(6):
				var p := ColorRect.new()
				p.size = Vector2(3, 3)
				p.color = Color(1.0, 0.85, 0.2, 0.8)
				p.global_position = door_world + Vector2(randf_range(-4, 4), randf_range(-4, 4))
				p.z_index = 8
				_room_container.add_child(p)
				var angle := float(i) / 6.0 * TAU
				var burst := Vector2(cos(angle), sin(angle)) * 20.0
				var pt: Tween = p.create_tween()
				pt.set_parallel(true)
				pt.tween_property(p, "global_position", p.global_position + burst, 0.3)
				pt.tween_property(p, "modulate:a", 0.0, 0.3)
				pt.chain().tween_callback(p.queue_free)
			_player.room_data = _room_data
			_pulse_wisps(Color(0.7, 0.55, 0.1, 0.5))
			_key_label.text = "KEY x%d" % _player.keys_held if _player.keys_held > 0 else ""

func _on_push_requested(block_pos: Vector2i, direction: Vector2i) -> void:
	if _try_push_block(block_pos, direction):
		# Player can now walk into the space the block left
		pass

func _on_room_exit(exit_pos: Vector2i) -> void:
	# Only advance if exiting from the right side (east)
	if exit_pos.x >= ROOM_COLS and _current_room_idx < 2:
		_rooms_cleared += 1
		_score += ROOM_CLEAR_POINTS
		_score_label.text = str(_score)
		_rooms_label.text = "Room %d/3" % (_current_room_idx + 2)
		# Room wipe transition
		var wipe := ColorRect.new()
		wipe.size = Vector2(640, 360)
		wipe.position = Vector2(-640, 0)
		wipe.color = Color(0.0, 0.0, 0.0, 0.8)
		wipe.z_index = 50
		add_child(wipe)
		var wipe_tw: Tween = wipe.create_tween()
		wipe_tw.tween_property(wipe, "position:x", 0.0, 0.1)
		wipe_tw.tween_property(wipe, "position:x", 640.0, 0.1)
		wipe_tw.tween_callback(wipe.queue_free)
		_load_room(_current_room_idx + 1)

func _on_exit_reached() -> void:
	_score += EXIT_POINTS
	var time_remaining: float = maxf(0.0, GAME_DURATION - _elapsed)
	_score += int(time_remaining) * TIME_BONUS_PER_SEC
	if _items_collected >= _total_items and _total_items > 0:
		_score += ALL_ITEMS_BONUS
	_end_game("LIBRARYNTH CLEARED!")

func _spawn_score_popup(grid_pos: Vector2i, points: int) -> void:
	var popup := Label.new()
	popup.text = "+%d" % points
	popup.add_theme_font_size_override("font_size", 10)
	popup.add_theme_color_override("font_color", AMBER)
	popup.position = Vector2(grid_pos.x * CELL_SIZE, grid_pos.y * CELL_SIZE + HUD_HEIGHT - 8)
	_vfx_container.add_child(popup)
	var tween: Tween = popup.create_tween()
	tween.set_parallel(true)
	tween.tween_property(popup, "position:y", popup.position.y - 20, 0.6)
	tween.tween_property(popup, "modulate:a", 0.0, 0.6)
	tween.chain().tween_callback(popup.queue_free)

# ─── HUD ─────────────────────────────────────────────────────────────────────

func _build_hud() -> void:
	# HUD background strip
	var hud_bg := ColorRect.new()
	hud_bg.size = Vector2(640, HUD_HEIGHT)
	hud_bg.color = Color(0.04, 0.03, 0.08, 0.9)
	_hud.add_child(hud_bg)

	# Score
	var score_hdr := Label.new()
	score_hdr.text = "SCORE"
	score_hdr.position = Vector2(550, 2)
	score_hdr.add_theme_font_size_override("font_size", 8)
	score_hdr.add_theme_color_override("font_color", Color(0.5, 0.4, 0.6))
	_hud.add_child(score_hdr)

	_score_label = Label.new()
	_score_label.text = "0"
	_score_label.position = Vector2(585, 2)
	_score_label.add_theme_font_size_override("font_size", 14)
	_score_label.add_theme_color_override("font_color", AMBER)
	_hud.add_child(_score_label)

	# Room indicator
	_rooms_label = Label.new()
	_rooms_label.text = "Room 1/3"
	_rooms_label.position = Vector2(280, 5)
	_rooms_label.add_theme_font_size_override("font_size", 10)
	_rooms_label.add_theme_color_override("font_color", Color(0.6, 0.55, 0.7))
	_rooms_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_rooms_label.custom_minimum_size = Vector2(80, 0)
	_hud.add_child(_rooms_label)

	# Key indicator
	_key_label = Label.new()
	_key_label.text = ""
	_key_label.position = Vector2(16, 5)
	_key_label.add_theme_font_size_override("font_size", 10)
	_key_label.add_theme_color_override("font_color", KEY_COLOR)
	_hud.add_child(_key_label)

	# Timer bar
	_timer_bar_bg = ColorRect.new()
	_timer_bar_bg.size = Vector2(600, 4)
	_timer_bar_bg.position = Vector2(20, 350)
	_timer_bar_bg.color = Color(0.15, 0.12, 0.18, 0.6)
	_hud.add_child(_timer_bar_bg)

	_timer_bar = ColorRect.new()
	_timer_bar.size = Vector2(600, 4)
	_timer_bar.position = Vector2(20, 350)
	_timer_bar.color = Color(0.29, 0.22, 0.16)
	_hud.add_child(_timer_bar)

	# Game over label (hidden)
	_game_over_label = Label.new()
	_game_over_label.text = ""
	_game_over_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_game_over_label.position = Vector2(170, 140)
	_game_over_label.size = Vector2(300, 60)
	_game_over_label.add_theme_font_size_override("font_size", 22)
	_game_over_label.add_theme_color_override("font_color", AMBER)
	_game_over_label.visible = false
	_hud.add_child(_game_over_label)

	# Title flash
	var title := Label.new()
	title.text = "THE LIBRARYNTH"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.position = Vector2(200, 150)
	title.size = Vector2(240, 40)
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color(0.7, 0.8, 1.0, 0.9))
	_hud.add_child(title)
	var tween: Tween = title.create_tween()
	tween.tween_interval(1.5)
	tween.tween_property(title, "modulate:a", 0.0, 0.5)
	tween.tween_callback(title.queue_free)

# ─── Touch UI ────────────────────────────────────────────────────────────────

func _build_touch_ui() -> void:
	var dpad_center := Vector2(70, 305)
	var btn_size := Vector2(32, 32)
	var gap := 36.0
	var dirs := {"up": Vector2(0, -gap), "down": Vector2(0, gap), "left": Vector2(-gap, 0), "right": Vector2(gap, 0)}
	for dir_name in dirs:
		var btn := ColorRect.new()
		btn.name = "Touch_%s" % dir_name
		btn.size = btn_size
		btn.position = dpad_center + dirs[dir_name] - btn_size / 2.0
		btn.color = Color(1.0, 1.0, 1.0, 0.08)
		btn.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_hud.add_child(btn)
		_touch_btns[dir_name] = btn
		# Chevron arrow
		var arrow := ColorRect.new()
		arrow.size = Vector2(3, 10)
		arrow.color = Color(1.0, 1.0, 1.0, 0.25)
		arrow.position = Vector2(14, 11)
		match dir_name:
			"up": arrow.rotation = 0.0; arrow.position = Vector2(14, 6)
			"down": arrow.rotation = PI; arrow.position = Vector2(18, 26)
			"left": arrow.rotation = -PI/2; arrow.position = Vector2(6, 18)
			"right": arrow.rotation = PI/2; arrow.position = Vector2(26, 14)
		btn.add_child(arrow)
	# Center dot
	var center := ColorRect.new()
	center.size = Vector2(8, 8)
	center.position = dpad_center - Vector2(4, 4)
	center.color = Color(1.0, 1.0, 1.0, 0.05)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud.add_child(center)

func _update_touch_dpad() -> void:
	if _touch_btns.is_empty(): return
	var pressing := Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
	var mouse_pos := Vector2(320, 180)
	if pressing:
		var vp := get_viewport()
		if vp: mouse_pos = vp.get_mouse_position()
	for dir_name in _touch_btns:
		var btn: ColorRect = _touch_btns[dir_name]
		if pressing:
			var btn_rect := Rect2(btn.position, btn.size)
			btn.color.a = 0.25 if btn_rect.has_point(mouse_pos) else 0.08
		else:
			btn.color.a = 0.08

# ─── Spirit Wisps ────────────────────────────────────────────────────────────

func _spawn_wisps() -> void:
	for i in range(WISP_COUNT):
		var wisp := ColorRect.new()
		var s: float = randf_range(1.5, 3.0)
		wisp.size = Vector2(s, s)
		wisp.position = Vector2(randf_range(10, 630), randf_range(30, 345))
		var tone: float = randf()
		if tone < 0.4:
			wisp.color = Color(0.3, 0.4, 0.8, randf_range(0.12, 0.25))
		elif tone < 0.7:
			wisp.color = Color(0.5, 0.3, 0.7, randf_range(0.12, 0.25))
		else:
			wisp.color = Color(0.7, 0.75, 0.85, randf_range(0.15, 0.3))
		_wisp_container.add_child(wisp)
		_wisps.append({
			"node": wisp,
			"base_pos": wisp.position,
			"phase": randf() * TAU,
			"speed": randf_range(0.3, 0.8),
			"amplitude": randf_range(8.0, 20.0),
		})

func _update_wisps(delta: float) -> void:
	for w in _wisps:
		var node: ColorRect = w["node"]
		if not is_instance_valid(node):
			continue
		w["phase"] += delta * w["speed"]
		var phase: float = w["phase"]
		var amp: float = w["amplitude"]
		var base: Vector2 = w["base_pos"]
		node.position = base + Vector2(sin(phase) * amp, cos(phase * 0.7) * amp * 0.6)

func _pulse_wisps(color: Color) -> void:
	for w in _wisps:
		var node: ColorRect = w["node"]
		if not is_instance_valid(node):
			continue
		var orig: Color = node.color
		node.color = color
		var tween: Tween = node.create_tween()
		tween.tween_property(node, "color", orig, 0.5)

# ─── Exit Beacon ─────────────────────────────────────────────────────────────

func _update_exit_beacon(delta: float) -> void:
	_exit_beacon_timer += delta
	if _exit_beacon_timer < 0.3:
		return
	_exit_beacon_timer = 0.0
	for rect in _exit_rects:
		if not is_instance_valid(rect):
			continue
		var particle := ColorRect.new()
		var s: float = randf_range(1.5, 3.0)
		particle.size = Vector2(s, s)
		particle.position = rect.position + Vector2(randf_range(2, CELL_SIZE - 2), float(CELL_SIZE))
		particle.color = Color(1.0, 0.8, 0.2, randf_range(0.4, 0.7))
		particle.z_index = 9
		_vfx_container.add_child(particle)
		var beacon_tw: Tween = particle.create_tween()
		beacon_tw.set_parallel(true)
		beacon_tw.tween_property(particle, "position:y", particle.position.y - randf_range(12.0, 22.0), 0.6)
		beacon_tw.tween_property(particle, "modulate:a", 0.0, 0.6)
		beacon_tw.chain().tween_callback(particle.queue_free)

# ─── Game Loop ───────────────────────────────────────────────────────────────

func _process(delta: float) -> void:
	if _game_over:
		_update_wisps(delta)
		return
	if not _game_started:
		return

	_elapsed += delta
	var progress: float = clampf(_elapsed / GAME_DURATION, 0.0, 1.0)

	# Timer bar
	_timer_bar.size.x = 600.0 * (1.0 - progress)
	if progress > 0.83:
		_timer_bar.color = Color(0.8, 0.2, 0.1)
	elif progress > 0.5:
		_timer_bar.color = Color(0.8, 0.5, 0.15)

	# Exit glow pulse
	for rect in _exit_rects:
		if is_instance_valid(rect):
			rect.color.a = 0.6 + sin(_elapsed * 4.0) * 0.3

	_update_hazards(delta)
	_update_wisps(delta)
	_update_touch_dpad()
	_update_exit_beacon(delta)

	if _elapsed >= GAME_DURATION:
		_end_game("TIME'S UP!")

# ─── Game End ────────────────────────────────────────────────────────────────

func _end_game(message: String) -> void:
	_game_over = true

	# Overlay
	var panel := ColorRect.new()
	panel.size = Vector2(640, 360)
	panel.color = Color(0, 0, 0, 0)
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud.add_child(panel)
	var fade_tween: Tween = panel.create_tween()
	fade_tween.tween_property(panel, "color:a", 0.7, 0.5)

	_game_over_label.text = message
	_game_over_label.visible = true
	_game_over_label.modulate.a = 0.0
	var label_tween: Tween = _game_over_label.create_tween()
	label_tween.tween_property(_game_over_label, "modulate:a", 1.0, 0.3).set_delay(0.3)

	# Score display
	var score_popup := Label.new()
	score_popup.text = "Score: %d" % _score
	score_popup.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	score_popup.position = Vector2(220, 180)
	score_popup.size = Vector2(200, 30)
	score_popup.add_theme_font_size_override("font_size", 14)
	score_popup.add_theme_color_override("font_color", Color(0.8, 0.7, 0.5))
	_hud.add_child(score_popup)
	score_popup.modulate.a = 0.0
	var sp_tween: Tween = score_popup.create_tween()
	sp_tween.tween_property(score_popup, "modulate:a", 1.0, 0.3).set_delay(0.5)

	# Wisps react
	if message == "LIBRARYNTH CLEARED!":
		_pulse_wisps(Color(0.85, 0.65, 0.2, 0.9))
	else:
		_pulse_wisps(Color(0.8, 0.2, 0.1, 0.8))

	# Emit after delay
	var end_tween: Tween = create_tween()
	end_tween.tween_interval(2.0)
	end_tween.tween_callback(func():
		_web_bridge.send_minigame_complete(_score, false)
	)
