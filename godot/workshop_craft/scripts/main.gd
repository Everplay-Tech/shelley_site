extends Node2D
## Workshop Craft — Tetris-style zone game for /workshop route.
## Wood blocks fall into a grid. Clear lines by filling rows.
## Themed around shaping wood for guitar building.
## 30-second zone game format with score emission.

const Piece = preload("res://scripts/piece.gd")

# ─── Grid Constants ──────────────────────────────────────────────────────────
const COLS := 10
const ROWS := 20
const CELL_SIZE := 16
const GRID_WIDTH: int = COLS * CELL_SIZE   # 160
const GRID_HEIGHT: int = ROWS * CELL_SIZE  # 320
# Center the grid in 640x360 viewport
const GRID_OFFSET_X: float = (640.0 - COLS * CELL_SIZE) / 2.0  # 240
const GRID_OFFSET_Y: float = (360.0 - ROWS * CELL_SIZE) / 2.0  # 20

# ─── Game Constants ──────────────────────────────────────────────────────────
const GAME_DURATION := 30.0
const START_FALL_SPEED := 0.8   # Seconds per cell at start
const END_FALL_SPEED := 0.3     # Seconds per cell at end
const LOCK_DELAY := 0.3
const SOFT_DROP_MULT := 10.0    # Fall speed multiplier when holding down
const DAS_DELAY := 0.18         # Delayed Auto Shift initial delay
const DAS_RATE := 0.05          # Auto-repeat rate
const LINE_SCORES := [0, 100, 300, 500, 800]

# ─── Wood Colors ─────────────────────────────────────────────────────────────
const BG_COLOR := Color(0.1, 0.08, 0.06, 1.0)       # Dark workshop
const GRID_BG_COLOR := Color(0.12, 0.1, 0.08, 1.0)   # Slightly lighter
const GRID_LINE_COLOR := Color(0.18, 0.15, 0.12, 1.0) # Subtle lines
const BORDER_COLOR := Color(0.35, 0.25, 0.15, 1.0)    # Wood frame
const GHOST_ALPHA := 0.2
const FLASH_COLOR := Color(1.0, 0.95, 0.85, 1.0)      # Warm white flash

# ─── State ───────────────────────────────────────────────────────────────────
var _grid: Array = []  # 2D: _grid[row][col] = null or Color
var _grid_rects: Array = []  # Visual: _grid_rects[row][col] = ColorRect
var _active_piece: Piece = null
var _ghost_rects: Array = []
var _active_rects: Array = []
var _next_piece_type: int = -1
var _next_preview_rects: Array = []

# Bag randomizer
var _bag: Array = []

# Timing
var _fall_timer := 0.0
var _lock_timer := 0.0
var _is_locking := false
var _game_timer := 0.0
var _game_over := false
var _game_started := false

# Input (DAS)
var _das_left_timer := 0.0
var _das_right_timer := 0.0
var _das_left_active := false
var _das_right_active := false

# Score / Stats
var _score := 0
var _lines_cleared := 0
var _combo := 0

# Line clear animation
var _clearing_rows: Array = []
var _clear_anim_timer := 0.0
const CLEAR_ANIM_DURATION := 0.25

# VFX state
var _elapsed := 0.0
var _grid_borders: Array = []  # [top, bottom, left, right] ColorRects
var _next_preview_glow: ColorRect = null

# ─── Node refs ───────────────────────────────────────────────────────────────
var _grid_container: Node2D
var _piece_container: Node2D
var _ghost_container: Node2D
var _vfx_container: Node2D
var _wisp_container: Node2D
var _hud: CanvasLayer
var _web_bridge: Node

# HUD elements
var _score_label: Label
var _lines_label: Label
var _timer_bar: ColorRect
var _timer_bar_bg: ColorRect
var _next_label: Label
var _combo_label: Label
var _game_over_label: Label

# Spirit wisps
var _wisps: Array = []
const WISP_COUNT := 12

func _ready() -> void:
	_grid_container = $GridContainer
	_piece_container = Node2D.new()
	_piece_container.name = "PieceContainer"
	add_child(_piece_container)
	_ghost_container = Node2D.new()
	_ghost_container.name = "GhostContainer"
	add_child(_ghost_container)
	_vfx_container = Node2D.new()
	_vfx_container.name = "VFXContainer"
	add_child(_vfx_container)
	_wisp_container = $WispContainer
	_hud = $HUD
	_web_bridge = $WebBridge

	_init_grid()
	_build_grid_visuals()
	_build_hud()
	_spawn_wisps()
	_start_game()

	_web_bridge.send_game_ready()

func _start_game() -> void:
	_game_started = true
	_game_over = false
	_game_timer = 0.0
	_score = 0
	_lines_cleared = 0
	_combo = 0
	_bag.clear()
	_fill_bag()
	_next_piece_type = _draw_from_bag()
	_spawn_piece()

func _init_grid() -> void:
	_grid.clear()
	for row in range(ROWS):
		var grid_row: Array = []
		for col in range(COLS):
			grid_row.append(null)  # null = empty
		_grid.append(grid_row)

func _build_grid_visuals() -> void:
	# Grid background
	var grid_bg := ColorRect.new()
	grid_bg.position = Vector2(GRID_OFFSET_X, GRID_OFFSET_Y)
	grid_bg.size = Vector2(GRID_WIDTH, GRID_HEIGHT)
	grid_bg.color = GRID_BG_COLOR
	_grid_container.add_child(grid_bg)

	# Grid lines
	for row in range(ROWS + 1):
		var hline := ColorRect.new()
		hline.position = Vector2(GRID_OFFSET_X, GRID_OFFSET_Y + row * CELL_SIZE)
		hline.size = Vector2(GRID_WIDTH, 1)
		hline.color = GRID_LINE_COLOR
		_grid_container.add_child(hline)
	for col in range(COLS + 1):
		var vline := ColorRect.new()
		vline.position = Vector2(GRID_OFFSET_X + col * CELL_SIZE, GRID_OFFSET_Y)
		vline.size = Vector2(1, GRID_HEIGHT)
		vline.color = GRID_LINE_COLOR
		_grid_container.add_child(vline)

	# Border frame
	_grid_borders.clear()
	var border_thickness := 2.0
	# Top
	var bt := ColorRect.new()
	bt.position = Vector2(GRID_OFFSET_X - border_thickness, GRID_OFFSET_Y - border_thickness)
	bt.size = Vector2(GRID_WIDTH + border_thickness * 2, border_thickness)
	bt.color = BORDER_COLOR
	_grid_container.add_child(bt)
	_grid_borders.append(bt)
	# Bottom
	var bb := ColorRect.new()
	bb.position = Vector2(GRID_OFFSET_X - border_thickness, GRID_OFFSET_Y + GRID_HEIGHT)
	bb.size = Vector2(GRID_WIDTH + border_thickness * 2, border_thickness)
	bb.color = BORDER_COLOR
	_grid_container.add_child(bb)
	_grid_borders.append(bb)
	# Left
	var bl := ColorRect.new()
	bl.position = Vector2(GRID_OFFSET_X - border_thickness, GRID_OFFSET_Y)
	bl.size = Vector2(border_thickness, GRID_HEIGHT)
	bl.color = BORDER_COLOR
	_grid_container.add_child(bl)
	_grid_borders.append(bl)
	# Right
	var br := ColorRect.new()
	br.position = Vector2(GRID_OFFSET_X + GRID_WIDTH, GRID_OFFSET_Y)
	br.size = Vector2(border_thickness, GRID_HEIGHT)
	br.color = BORDER_COLOR
	_grid_container.add_child(br)
	_grid_borders.append(br)

	# Cell rects (initially invisible, shown when locked)
	_grid_rects.clear()
	for row in range(ROWS):
		var row_rects: Array = []
		for col in range(COLS):
			var cell := ColorRect.new()
			cell.position = Vector2(GRID_OFFSET_X + col * CELL_SIZE + 1, GRID_OFFSET_Y + row * CELL_SIZE + 1)
			cell.size = Vector2(CELL_SIZE - 2, CELL_SIZE - 2)
			cell.color = Color.TRANSPARENT
			cell.visible = false
			_grid_container.add_child(cell)
			row_rects.append(cell)
		_grid_rects.append(row_rects)

func _build_hud() -> void:
	# Score
	_score_label = Label.new()
	_score_label.text = "0"
	_score_label.position = Vector2(GRID_OFFSET_X + GRID_WIDTH + 20, 30)
	_score_label.add_theme_font_size_override("font_size", 20)
	_score_label.add_theme_color_override("font_color", Color(0.85, 0.65, 0.2))
	_hud.add_child(_score_label)

	# Score header
	var score_hdr := Label.new()
	score_hdr.text = "SCORE"
	score_hdr.position = Vector2(GRID_OFFSET_X + GRID_WIDTH + 20, 14)
	score_hdr.add_theme_font_size_override("font_size", 10)
	score_hdr.add_theme_color_override("font_color", Color(0.6, 0.45, 0.2))
	_hud.add_child(score_hdr)

	# Lines
	_lines_label = Label.new()
	_lines_label.text = "Lines: 0"
	_lines_label.position = Vector2(GRID_OFFSET_X + GRID_WIDTH + 20, 60)
	_lines_label.add_theme_font_size_override("font_size", 12)
	_lines_label.add_theme_color_override("font_color", Color(0.6, 0.5, 0.3))
	_hud.add_child(_lines_label)

	# Next piece header
	_next_label = Label.new()
	_next_label.text = "NEXT"
	_next_label.position = Vector2(GRID_OFFSET_X + GRID_WIDTH + 20, 90)
	_next_label.add_theme_font_size_override("font_size", 10)
	_next_label.add_theme_color_override("font_color", Color(0.6, 0.45, 0.2))
	_hud.add_child(_next_label)

	# Combo label (hidden initially)
	_combo_label = Label.new()
	_combo_label.text = ""
	_combo_label.position = Vector2(GRID_OFFSET_X + GRID_WIDTH + 20, 190)
	_combo_label.add_theme_font_size_override("font_size", 16)
	_combo_label.add_theme_color_override("font_color", Color(1.0, 0.8, 0.2))
	_combo_label.visible = false
	_hud.add_child(_combo_label)

	# Timer bar background
	_timer_bar_bg = ColorRect.new()
	_timer_bar_bg.position = Vector2(GRID_OFFSET_X, GRID_OFFSET_Y + GRID_HEIGHT + 6)
	_timer_bar_bg.size = Vector2(GRID_WIDTH, 6)
	_timer_bar_bg.color = Color(0.15, 0.12, 0.08)
	_hud.add_child(_timer_bar_bg)

	# Timer bar fill
	_timer_bar = ColorRect.new()
	_timer_bar.position = Vector2(GRID_OFFSET_X, GRID_OFFSET_Y + GRID_HEIGHT + 6)
	_timer_bar.size = Vector2(GRID_WIDTH, 6)
	_timer_bar.color = Color(0.65, 0.45, 0.15)
	_hud.add_child(_timer_bar)

	# Game over label
	_game_over_label = Label.new()
	_game_over_label.text = ""
	_game_over_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_game_over_label.position = Vector2(200, 150)
	_game_over_label.size = Vector2(240, 60)
	_game_over_label.add_theme_font_size_override("font_size", 24)
	_game_over_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.3))
	_game_over_label.visible = false
	_hud.add_child(_game_over_label)

	# Controls hint (left side)
	var hint := Label.new()
	hint.text = "ARROWS Move\nUP Rotate\nSPACE Drop"
	hint.position = Vector2(20, GRID_OFFSET_Y + 200)
	hint.add_theme_font_size_override("font_size", 9)
	hint.add_theme_color_override("font_color", Color(0.4, 0.35, 0.25))
	_hud.add_child(hint)

	# Title (left side, top)
	var title := Label.new()
	title.text = "WORKSHOP\n  CRAFT"
	title.position = Vector2(20, 30)
	title.add_theme_font_size_override("font_size", 16)
	title.add_theme_color_override("font_color", Color(0.55, 0.4, 0.2))
	_hud.add_child(title)

	_build_touch_ui()

func _build_touch_ui() -> void:
	# Left arrow — left margin
	var left_btn := ColorRect.new()
	left_btn.name = "TouchLeft"
	left_btn.size = Vector2(48, 40)
	left_btn.position = Vector2(8, 290)
	left_btn.color = Color(1.0, 1.0, 1.0, 0.08)
	left_btn.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud.add_child(left_btn)
	var lc := ColorRect.new(); lc.size = Vector2(3, 12); lc.position = Vector2(18, 14); lc.color = Color(1,1,1,0.25); lc.rotation = 0.5; left_btn.add_child(lc)
	var lc2 := ColorRect.new(); lc2.size = Vector2(3, 12); lc2.position = Vector2(18, 26); lc2.color = Color(1,1,1,0.25); lc2.rotation = -0.5; left_btn.add_child(lc2)

	# Right arrow — left margin offset
	var right_btn := ColorRect.new()
	right_btn.name = "TouchRight"
	right_btn.size = Vector2(48, 40)
	right_btn.position = Vector2(68, 290)
	right_btn.color = Color(1.0, 1.0, 1.0, 0.08)
	right_btn.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud.add_child(right_btn)
	var rc := ColorRect.new(); rc.size = Vector2(3, 12); rc.position = Vector2(26, 14); rc.color = Color(1,1,1,0.25); rc.rotation = -0.5; right_btn.add_child(rc)
	var rc2 := ColorRect.new(); rc2.size = Vector2(3, 12); rc2.position = Vector2(26, 26); rc2.color = Color(1,1,1,0.25); rc2.rotation = 0.5; right_btn.add_child(rc2)

	# Rotate button — right margin top
	var rot_btn := ColorRect.new()
	rot_btn.name = "TouchRotate"
	rot_btn.size = Vector2(56, 36)
	rot_btn.position = Vector2(556, 60)
	rot_btn.color = Color(0.5, 0.8, 1.0, 0.08)
	rot_btn.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud.add_child(rot_btn)
	var rot_lbl := Label.new()
	rot_lbl.text = "ROT"
	rot_lbl.add_theme_font_size_override("font_size", 9)
	rot_lbl.add_theme_color_override("font_color", Color(0.5, 0.8, 1.0, 0.25))
	rot_lbl.position = Vector2(14, 10)
	rot_btn.add_child(rot_lbl)

	# Drop button — bottom center
	var drop_btn := ColorRect.new()
	drop_btn.name = "TouchDrop"
	drop_btn.size = Vector2(100, 32)
	drop_btn.position = Vector2(270, 300)
	drop_btn.color = Color(1.0, 0.75, 0.0, 0.06)
	drop_btn.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud.add_child(drop_btn)
	var drop_lbl := Label.new()
	drop_lbl.text = "DROP"
	drop_lbl.add_theme_font_size_override("font_size", 9)
	drop_lbl.add_theme_color_override("font_color", Color(1.0, 0.75, 0.0, 0.2))
	drop_lbl.position = Vector2(32, 8)
	drop_btn.add_child(drop_lbl)

	# Next piece preview glow (behind preview area)
	_next_preview_glow = ColorRect.new()
	_next_preview_glow.name = "NextPreviewGlow"
	_next_preview_glow.size = Vector2(60, 50)
	_next_preview_glow.position = Vector2(GRID_OFFSET_X + GRID_WIDTH + 16, 110)
	_next_preview_glow.color = Color(0.85, 0.65, 0.2, 0.04)
	_next_preview_glow.z_index = -1
	_hud.add_child(_next_preview_glow)

# ─── Bag Randomizer ──────────────────────────────────────────────────────────

func _fill_bag() -> void:
	_bag = [0, 1, 2, 3, 4, 5, 6]  # All 7 piece types
	# Fisher-Yates shuffle
	for i in range(_bag.size() - 1, 0, -1):
		var j: int = randi_range(0, i)
		var tmp: int = _bag[i]
		_bag[i] = _bag[j]
		_bag[j] = tmp

func _draw_from_bag() -> int:
	if _bag.is_empty():
		_fill_bag()
	return _bag.pop_front()

# ─── Piece Management ────────────────────────────────────────────────────────

func _spawn_piece() -> void:
	var piece_type: int = _next_piece_type
	_next_piece_type = _draw_from_bag()
	# Spawn at top center
	var spawn_x := 3
	if piece_type == Piece.PieceType.I:
		spawn_x = 3
	elif piece_type == Piece.PieceType.O:
		spawn_x = 4
	_active_piece = Piece.new(piece_type, Vector2i(spawn_x, 0))
	_fall_timer = 0.0
	_lock_timer = 0.0
	_is_locking = false

	# Check if spawn position is blocked → game over
	if not _can_place(_active_piece.get_cells()):
		_end_game("STACKED OUT!")
		return

	_update_active_visuals()
	_update_ghost_visuals()
	_update_next_preview()

func _can_place(cells: Array) -> bool:
	for cell in cells:
		var c: Vector2i = cell
		if c.x < 0 or c.x >= COLS or c.y < 0 or c.y >= ROWS:
			return false
		if _grid[c.y][c.x] != null:
			return false
	return true

func _try_move(dx: int, dy: int) -> bool:
	if _active_piece == null:
		return false
	var new_pos := _active_piece.grid_pos + Vector2i(dx, dy)
	var new_cells := _active_piece.get_cells_at(_active_piece.rotation, new_pos)
	if _can_place(new_cells):
		_active_piece.grid_pos = new_pos
		if dy > 0:
			_is_locking = false
			_lock_timer = 0.0
		_update_active_visuals()
		_update_ghost_visuals()
		return true
	return false

func _try_rotate() -> bool:
	if _active_piece == null:
		return false
	var new_rot: int = _active_piece.next_rotation()
	var kicks: Array = _active_piece.get_wall_kicks()
	for kick in kicks:
		var k: Vector2i = kick
		var test_pos := _active_piece.grid_pos + k
		var test_cells := _active_piece.get_cells_at(new_rot, test_pos)
		if _can_place(test_cells):
			_active_piece.rotation = new_rot
			_active_piece.grid_pos = test_pos
			_lock_timer = 0.0  # Reset lock on successful rotate
			_update_active_visuals()
			_update_ghost_visuals()
			return true
	return false

func _hard_drop() -> void:
	if _active_piece == null:
		return
	var drop_count := 0
	while _try_move(0, 1):
		drop_count += 1
	_score += drop_count * 2  # Hard drop bonus

	# Speed trail VFX on hard drop
	if drop_count > 0:
		var drop_cells := _active_piece.get_cells()
		for cell in drop_cells:
			var c: Vector2i = cell
			if c.y < 0:
				continue
			var trail := ColorRect.new()
			trail.size = Vector2(CELL_SIZE - 2, CELL_SIZE * 3)
			trail.position = Vector2(GRID_OFFSET_X + c.x * CELL_SIZE + 1, GRID_OFFSET_Y + (c.y - 3) * CELL_SIZE)
			trail.color = Color(1.0, 0.85, 0.5, 0.15)
			trail.z_index = 5
			add_child(trail)
			var tt: Tween = trail.create_tween()
			tt.tween_property(trail, "modulate:a", 0.0, 0.15)
			tt.tween_callback(trail.queue_free)

	_lock_piece()

func _lock_piece() -> void:
	if _active_piece == null:
		return
	var cells := _active_piece.get_cells()
	var color := _active_piece.get_color()
	for cell in cells:
		var c: Vector2i = cell
		if c.y >= 0 and c.y < ROWS and c.x >= 0 and c.x < COLS:
			_grid[c.y][c.x] = color
			_grid_rects[c.y][c.x].color = color
			_grid_rects[c.y][c.x].visible = true
			# Lock flash
			_grid_rects[c.y][c.x].color = FLASH_COLOR
			var tween: Tween = _grid_rects[c.y][c.x].create_tween()
			tween.tween_property(_grid_rects[c.y][c.x], "color", color, 0.15)

	# Add wood grain lines (subtle detail)
	for cell in cells:
		var c: Vector2i = cell
		if c.y >= 0 and c.y < ROWS and c.x >= 0 and c.x < COLS:
			_add_wood_grain(c.x, c.y, color)

	_clear_active_visuals()
	_clear_ghost_visuals()
	_check_lines()

func _add_wood_grain(col: int, row: int, base_color: Color) -> void:
	# 2 subtle horizontal grain lines per cell
	for i in range(2):
		var grain := ColorRect.new()
		var y_off: float = 4.0 + i * 6.0 + randf_range(-1.0, 1.0)
		grain.position = Vector2(
			GRID_OFFSET_X + col * CELL_SIZE + 2,
			GRID_OFFSET_Y + row * CELL_SIZE + y_off
		)
		grain.size = Vector2(CELL_SIZE - 4, 1)
		grain.color = Color(base_color.r * 0.85, base_color.g * 0.85, base_color.b * 0.85, 0.4)
		_grid_container.add_child(grain)

# ─── Line Clear ──────────────────────────────────────────────────────────────

func _check_lines() -> void:
	_clearing_rows.clear()
	for row in range(ROWS):
		var full := true
		for col in range(COLS):
			if _grid[row][col] == null:
				full = false
				break
		if full:
			_clearing_rows.append(row)

	if _clearing_rows.is_empty():
		_combo = 0
		_spawn_piece()
		return

	# Start clear animation
	_clear_anim_timer = 0.0
	var num_lines: int = _clearing_rows.size()
	var line_score: int = LINE_SCORES[mini(num_lines, 4)]

	# Combo bonus
	_combo += 1
	if _combo > 1:
		line_score = int(line_score * (1.0 + (_combo - 1) * 0.5))
		_show_combo(_combo)

	_score += line_score
	_lines_cleared += num_lines

	# Flash clearing rows white
	for row in _clearing_rows:
		for col in range(COLS):
			if _grid_rects[row][col].visible:
				_grid_rects[row][col].color = FLASH_COLOR

	# Wisp pulse on line clear
	_pulse_wisps(Color(0.85, 0.65, 0.2, 0.8))

	# Spawn wood chip particles
	for row in _clearing_rows:
		for col in range(COLS):
			_spawn_wood_chips(col, row)

	# Screen shake scales with lines cleared
	var cleared_count: int = _clearing_rows.size()
	var shake_mag: float = 1.0 + cleared_count * 0.8
	var shake_tw: Tween = create_tween()
	for i in range(5):
		var intensity: float = shake_mag * (1.0 - float(i) / 5.0)
		shake_tw.tween_property(self, "position", Vector2(randf_range(-intensity, intensity), randf_range(-intensity * 0.5, intensity * 0.5)), 0.03)
	shake_tw.tween_property(self, "position", Vector2.ZERO, 0.05)
	# Hit freeze for multi-line clears (MvC style)
	if cleared_count >= 2:
		Engine.time_scale = 0.15
		await get_tree().create_timer(0.04, true, false, true).timeout
		Engine.time_scale = 1.0

func _finish_line_clear() -> void:
	# Remove rows from grid data + shift down
	var rows_sorted: Array = _clearing_rows.duplicate()
	rows_sorted.sort()
	rows_sorted.reverse()  # Start from bottom

	for row in rows_sorted:
		_grid.remove_at(row)
		# Add empty row at top
		var empty_row: Array = []
		for col in range(COLS):
			empty_row.append(null)
		_grid.insert(0, empty_row)

	# Rebuild all grid visuals
	_refresh_grid_visuals()
	_clearing_rows.clear()
	_spawn_piece()

func _refresh_grid_visuals() -> void:
	for row in range(ROWS):
		for col in range(COLS):
			var cell_color = _grid[row][col]
			if cell_color != null:
				_grid_rects[row][col].color = cell_color
				_grid_rects[row][col].visible = true
			else:
				_grid_rects[row][col].visible = false

	# Clear all extra children (grain lines) and re-add them
	# (Simpler than tracking individual grain rects)
	var children_to_remove: Array = []
	for child in _grid_container.get_children():
		if child is ColorRect and not _is_grid_structural(child):
			children_to_remove.append(child)
	# Only remove grain children (small ones positioned within cells)
	# Actually, let's just re-add grains for visible cells
	for row in range(ROWS):
		for col in range(COLS):
			if _grid[row][col] != null:
				# Grain lines get recreated on lock, we skip re-adding here
				# to avoid too many nodes. The base cell color is enough.
				pass

func _is_grid_structural(node: ColorRect) -> bool:
	# Check if it's a grid rect, background, border, or grid line
	for row in _grid_rects:
		if node in row:
			return true
	# Check by size — structural elements are full-width or full-height
	if node.size.x >= GRID_WIDTH or node.size.y >= GRID_HEIGHT:
		return true
	if node.size.x <= 2 or node.size.y <= 1:
		return true  # Grid lines / borders
	return false

func _spawn_wood_chips(col: int, row: int) -> void:
	for i in range(3):
		var chip := ColorRect.new()
		var s: float = randf_range(2.0, 4.0)
		chip.size = Vector2(s, s)
		chip.position = Vector2(
			GRID_OFFSET_X + col * CELL_SIZE + randf_range(0, CELL_SIZE),
			GRID_OFFSET_Y + row * CELL_SIZE + randf_range(0, CELL_SIZE)
		)
		chip.color = Color(
			randf_range(0.4, 0.7),
			randf_range(0.25, 0.5),
			randf_range(0.1, 0.25),
			0.8
		)
		_vfx_container.add_child(chip)
		var angle: float = randf_range(-PI, PI)
		var dist: float = randf_range(10, 30)
		var target := chip.position + Vector2(cos(angle) * dist, sin(angle) * dist - 15)
		var tween: Tween = chip.create_tween()
		tween.set_parallel(true)
		tween.tween_property(chip, "position", target, 0.4)
		tween.tween_property(chip, "color:a", 0.0, 0.4)
		tween.chain().tween_callback(chip.queue_free)

func _show_combo(count: int) -> void:
	_combo_label.text = "x%d!" % count
	_combo_label.visible = true
	_combo_label.modulate = Color(1.0, 0.85, 0.2, 1.0)
	var tween: Tween = _combo_label.create_tween()
	tween.tween_property(_combo_label, "modulate:a", 0.0, 1.0)
	tween.tween_callback(func(): _combo_label.visible = false)

# ─── Visual Updates ──────────────────────────────────────────────────────────

func _update_active_visuals() -> void:
	_clear_active_visuals()
	if _active_piece == null:
		return
	var cells := _active_piece.get_cells()
	var color := _active_piece.get_color()
	for cell in cells:
		var c: Vector2i = cell
		if c.y < 0:
			continue  # Don't draw above grid
		var rect := ColorRect.new()
		rect.position = Vector2(
			GRID_OFFSET_X + c.x * CELL_SIZE + 1,
			GRID_OFFSET_Y + c.y * CELL_SIZE + 1
		)
		rect.size = Vector2(CELL_SIZE - 2, CELL_SIZE - 2)
		rect.color = color
		_piece_container.add_child(rect)
		_active_rects.append(rect)

func _clear_active_visuals() -> void:
	for rect in _active_rects:
		if is_instance_valid(rect):
			rect.queue_free()
	_active_rects.clear()

func _update_ghost_visuals() -> void:
	_clear_ghost_visuals()
	if _active_piece == null:
		return
	# Find ghost position (lowest valid placement)
	var ghost_pos := _active_piece.grid_pos
	while true:
		var test_pos := ghost_pos + Vector2i(0, 1)
		var test_cells := _active_piece.get_cells_at(_active_piece.rotation, test_pos)
		if _can_place(test_cells):
			ghost_pos = test_pos
		else:
			break

	if ghost_pos == _active_piece.grid_pos:
		return  # Ghost is same as piece, skip

	var offsets: Array = Piece.SHAPES[_active_piece.piece_type][_active_piece.rotation]
	var color := _active_piece.get_color()
	color.a = GHOST_ALPHA
	for offset in offsets:
		var c: Vector2i = ghost_pos + offset
		if c.y < 0:
			continue
		var rect := ColorRect.new()
		rect.position = Vector2(
			GRID_OFFSET_X + c.x * CELL_SIZE + 1,
			GRID_OFFSET_Y + c.y * CELL_SIZE + 1
		)
		rect.size = Vector2(CELL_SIZE - 2, CELL_SIZE - 2)
		rect.color = color
		_ghost_container.add_child(rect)
		_ghost_rects.append(rect)

func _clear_ghost_visuals() -> void:
	for rect in _ghost_rects:
		if is_instance_valid(rect):
			rect.queue_free()
	_ghost_rects.clear()

func _update_next_preview() -> void:
	# Clear old preview
	for rect in _next_preview_rects:
		if is_instance_valid(rect):
			rect.queue_free()
	_next_preview_rects.clear()

	if _next_piece_type < 0:
		return

	var offsets: Array = Piece.SHAPES[_next_piece_type][0]  # Rotation 0
	var color: Color = Piece.COLORS[_next_piece_type]
	var preview_x: float = GRID_OFFSET_X + GRID_WIDTH + 20
	var preview_y: float = 115.0
	var preview_cell := 12.0

	for offset in offsets:
		var o: Vector2i = offset
		var rect := ColorRect.new()
		rect.position = Vector2(preview_x + o.x * preview_cell, preview_y + o.y * preview_cell)
		rect.size = Vector2(preview_cell - 2, preview_cell - 2)
		rect.color = color
		_hud.add_child(rect)
		_next_preview_rects.append(rect)

# ─── Spirit Wisps ────────────────────────────────────────────────────────────

func _spawn_wisps() -> void:
	for i in range(WISP_COUNT):
		var wisp := ColorRect.new()
		var s: float = randf_range(2.0, 4.0)
		wisp.size = Vector2(s, s)
		wisp.position = Vector2(randf_range(10, 630), randf_range(10, 350))
		# Warm wood tones for workshop
		var tone: float = randf_range(0.0, 1.0)
		if tone < 0.4:
			wisp.color = Color(0.65, 0.45, 0.15, 0.3)  # Amber
		elif tone < 0.7:
			wisp.color = Color(0.5, 0.35, 0.2, 0.25)   # Brown
		else:
			wisp.color = Color(0.8, 0.6, 0.2, 0.35)     # Gold
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
		var wisp_data: Dictionary = w
		var node: ColorRect = wisp_data["node"]
		if not is_instance_valid(node):
			continue
		var phase: float = wisp_data["phase"]
		var spd: float = wisp_data["speed"]
		var amp: float = wisp_data["amplitude"]
		var base: Vector2 = wisp_data["base_pos"]
		wisp_data["phase"] = phase + delta * spd
		node.position = base + Vector2(
			sin(phase) * amp,
			cos(phase * 0.7) * amp * 0.6
		)

func _pulse_wisps(color: Color) -> void:
	for w in _wisps:
		var node: ColorRect = w["node"]
		if not is_instance_valid(node):
			continue
		var orig_color: Color = node.color
		node.color = color
		var tween: Tween = node.create_tween()
		tween.tween_property(node, "color", orig_color, 0.5)

# ─── Game Loop ───────────────────────────────────────────────────────────────

func _process(delta: float) -> void:
	if _game_over:
		_update_wisps(delta)
		return

	if not _game_started:
		return

	_game_timer += delta
	_elapsed += delta
	_update_wisps(delta)
	_update_touch_highlights()

	# Next preview glow pulse
	if _next_preview_glow and is_instance_valid(_next_preview_glow):
		var glow_pulse: float = 0.04 + sin(_elapsed * 2.5) * 0.02
		_next_preview_glow.color.a = glow_pulse

	# Timer bar
	var time_left: float = maxf(0.0, GAME_DURATION - _game_timer)
	var timer_ratio: float = time_left / GAME_DURATION
	_timer_bar.size.x = GRID_WIDTH * timer_ratio
	# Color shifts from wood→red as time runs out
	if timer_ratio < 0.25:
		_timer_bar.color = Color(0.8, 0.2, 0.1)
	elif timer_ratio < 0.5:
		_timer_bar.color = Color(0.8, 0.5, 0.15)

	# Grid border pulse when timer < 25%
	var progress: float = 1.0 - timer_ratio
	if progress > 0.75:
		var pulse: float = sin(_elapsed * 6.0)
		for border in _grid_borders:
			if is_instance_valid(border):
				border.color = Color(0.7, 0.2, 0.1, 0.6) if pulse > 0.0 else BORDER_COLOR
	else:
		for border in _grid_borders:
			if is_instance_valid(border):
				border.color = BORDER_COLOR

	# Time up?
	if _game_timer >= GAME_DURATION:
		_end_game("CRAFTED!")
		return

	# Line clear animation in progress
	if not _clearing_rows.is_empty():
		_clear_anim_timer += delta
		if _clear_anim_timer >= CLEAR_ANIM_DURATION:
			_finish_line_clear()
		return

	# Update HUD
	_score_label.text = str(_score)
	_lines_label.text = "Lines: %d" % _lines_cleared

	# Input
	_handle_input(delta)

	# Gravity
	if _active_piece != null:
		var fall_speed: float = lerpf(START_FALL_SPEED, END_FALL_SPEED, _game_timer / GAME_DURATION)
		if Input.is_action_pressed("move_down"):
			fall_speed /= SOFT_DROP_MULT
		_fall_timer += delta
		if _fall_timer >= fall_speed:
			_fall_timer = 0.0
			if not _try_move(0, 1):
				# Can't move down — start lock timer
				if not _is_locking:
					_is_locking = true
					_lock_timer = 0.0

		# Lock delay
		if _is_locking:
			_lock_timer += delta
			if _lock_timer >= LOCK_DELAY:
				_lock_piece()

func _handle_input(delta: float) -> void:
	if _active_piece == null:
		return

	# Rotate
	if Input.is_action_just_pressed("rotate_cw"):
		_try_rotate()

	# Hard drop
	if Input.is_action_just_pressed("hard_drop"):
		_hard_drop()
		return

	# DAS left
	if Input.is_action_just_pressed("move_left"):
		_try_move(-1, 0)
		_das_left_timer = 0.0
		_das_left_active = false
	elif Input.is_action_pressed("move_left"):
		_das_left_timer += delta
		if not _das_left_active:
			if _das_left_timer >= DAS_DELAY:
				_das_left_active = true
				_das_left_timer = 0.0
		else:
			if _das_left_timer >= DAS_RATE:
				_das_left_timer = 0.0
				_try_move(-1, 0)
	else:
		_das_left_timer = 0.0
		_das_left_active = false

	# DAS right
	if Input.is_action_just_pressed("move_right"):
		_try_move(1, 0)
		_das_right_timer = 0.0
		_das_right_active = false
	elif Input.is_action_pressed("move_right"):
		_das_right_timer += delta
		if not _das_right_active:
			if _das_right_timer >= DAS_DELAY:
				_das_right_active = true
				_das_right_timer = 0.0
		else:
			if _das_right_timer >= DAS_RATE:
				_das_right_timer = 0.0
				_try_move(1, 0)
	else:
		_das_right_timer = 0.0
		_das_right_active = false

	# Touch controls
	_handle_touch()

var _touch_start_pos := Vector2.ZERO
var _touch_active := false

func _handle_touch() -> void:
	if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		if not _touch_active:
			_touch_active = true
			_touch_start_pos = get_viewport().get_mouse_position()
		else:
			var current := get_viewport().get_mouse_position()
			var diff := current - _touch_start_pos
			# Swipe down for hard drop
			if diff.y > 60:
				_hard_drop()
				_touch_active = false
	else:
		if _touch_active:
			_touch_active = false
			var end_pos := get_viewport().get_mouse_position()
			var diff := end_pos - _touch_start_pos
			if absf(diff.x) < 20 and absf(diff.y) < 20:
				# Tap — match visible button zones
				var tp := _touch_start_pos
				if _point_in_btn("TouchLeft", tp):
					_try_move(-1, 0)
				elif _point_in_btn("TouchRight", tp):
					_try_move(1, 0)
				elif _point_in_btn("TouchRotate", tp):
					_try_rotate()
				elif _point_in_btn("TouchDrop", tp):
					_hard_drop()
				else:
					# Fallback: legacy zone taps for grid area
					if tp.y < 120:
						_try_rotate()
					elif tp.x < 320:
						_try_move(-1, 0)
					else:
						_try_move(1, 0)

func _point_in_btn(btn_name: String, point: Vector2) -> bool:
	var btn := _hud.get_node_or_null(btn_name)
	if btn == null:
		return false
	return Rect2(btn.position, btn.size).has_point(point)

func _update_touch_highlights() -> void:
	var btns := {"TouchLeft": false, "TouchRight": false, "TouchRotate": false, "TouchDrop": false}
	var pressing := Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
	if pressing:
		var vp := get_viewport()
		if vp:
			var mp := vp.get_mouse_position()
			for btn_name in btns:
				var btn := _hud.get_node_or_null(btn_name)
				if btn:
					var rect := Rect2(btn.position, btn.size)
					if rect.has_point(mp):
						btns[btn_name] = true
	for btn_name in btns:
		var btn := _hud.get_node_or_null(btn_name)
		if btn:
			if btns[btn_name]:
				btn.color.a = 0.2
			elif "Drop" in btn_name:
				btn.color.a = 0.06
			else:
				btn.color.a = 0.08

# ─── Game End ────────────────────────────────────────────────────────────────

func _end_game(message: String) -> void:
	_game_over = true
	_active_piece = null
	_clear_active_visuals()
	_clear_ghost_visuals()

	# Show game over label
	_game_over_label.text = message
	_game_over_label.visible = true
	_game_over_label.modulate.a = 0.0
	var tween: Tween = _game_over_label.create_tween()
	tween.tween_property(_game_over_label, "modulate:a", 1.0, 0.3)

	# Wisps react
	if message == "STACKED OUT!":
		_pulse_wisps(Color(0.8, 0.2, 0.1, 0.8))
	else:
		_pulse_wisps(Color(0.85, 0.65, 0.2, 0.9))

	# Score popup
	_spawn_score_popup()

	# Wait 2s then emit complete
	var end_tween := create_tween()
	end_tween.tween_interval(2.0)
	end_tween.tween_callback(func():
		_web_bridge.send_minigame_complete(_score, false)
	)

func _spawn_score_popup() -> void:
	var popup := Label.new()
	popup.text = "Score: %d" % _score
	popup.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	popup.position = Vector2(220, 190)
	popup.size = Vector2(200, 40)
	popup.add_theme_font_size_override("font_size", 16)
	popup.add_theme_color_override("font_color", Color(0.8, 0.6, 0.2))
	_hud.add_child(popup)
	popup.modulate.a = 0.0
	var tween: Tween = popup.create_tween()
	tween.tween_property(popup, "modulate:a", 1.0, 0.3).set_delay(0.3)
