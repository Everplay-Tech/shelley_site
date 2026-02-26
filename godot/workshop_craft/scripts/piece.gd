extends RefCounted
## Tetromino piece — holds shape data, rotation state, grid position.
## Used by main.gd to manage the active falling piece.

## Piece types (standard 7 Tetrominos)
enum PieceType { I, O, T, S, Z, L, J }

## Wood-tone colors per piece type
const COLORS := {
	PieceType.I: Color(0.55, 0.35, 0.2, 1.0),    # Walnut
	PieceType.O: Color(0.85, 0.75, 0.55, 1.0),    # Maple
	PieceType.T: Color(0.5, 0.22, 0.15, 1.0),     # Mahogany
	PieceType.S: Color(0.7, 0.45, 0.25, 1.0),      # Cedar
	PieceType.Z: Color(0.8, 0.7, 0.5, 1.0),        # Spruce
	PieceType.L: Color(0.4, 0.18, 0.12, 1.0),      # Rosewood
	PieceType.J: Color(0.15, 0.12, 0.1, 1.0),      # Ebony
}

## Cell offsets for each piece type in each rotation (0-3)
## Origin is top-left of bounding box; cells are relative offsets
const SHAPES := {
	PieceType.I: [
		[Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1), Vector2i(3, 1)],
		[Vector2i(2, 0), Vector2i(2, 1), Vector2i(2, 2), Vector2i(2, 3)],
		[Vector2i(0, 2), Vector2i(1, 2), Vector2i(2, 2), Vector2i(3, 2)],
		[Vector2i(1, 0), Vector2i(1, 1), Vector2i(1, 2), Vector2i(1, 3)],
	],
	PieceType.O: [
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1)],
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1)],
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1)],
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1)],
	],
	PieceType.T: [
		[Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1)],
		[Vector2i(1, 0), Vector2i(1, 1), Vector2i(2, 1), Vector2i(1, 2)],
		[Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1), Vector2i(1, 2)],
		[Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(1, 2)],
	],
	PieceType.S: [
		[Vector2i(1, 0), Vector2i(2, 0), Vector2i(0, 1), Vector2i(1, 1)],
		[Vector2i(1, 0), Vector2i(1, 1), Vector2i(2, 1), Vector2i(2, 2)],
		[Vector2i(1, 1), Vector2i(2, 1), Vector2i(0, 2), Vector2i(1, 2)],
		[Vector2i(0, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(1, 2)],
	],
	PieceType.Z: [
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(1, 1), Vector2i(2, 1)],
		[Vector2i(2, 0), Vector2i(1, 1), Vector2i(2, 1), Vector2i(1, 2)],
		[Vector2i(0, 1), Vector2i(1, 1), Vector2i(1, 2), Vector2i(2, 2)],
		[Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(0, 2)],
	],
	PieceType.L: [
		[Vector2i(2, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1)],
		[Vector2i(1, 0), Vector2i(1, 1), Vector2i(1, 2), Vector2i(2, 2)],
		[Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1), Vector2i(0, 2)],
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(1, 1), Vector2i(1, 2)],
	],
	PieceType.J: [
		[Vector2i(0, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1)],
		[Vector2i(1, 0), Vector2i(2, 0), Vector2i(1, 1), Vector2i(1, 2)],
		[Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1), Vector2i(2, 2)],
		[Vector2i(1, 0), Vector2i(1, 1), Vector2i(0, 2), Vector2i(1, 2)],
	],
}

## SRS wall kick data (standard rotation system)
const WALL_KICKS := {
	"normal": [
		# 0→1
		[Vector2i(0, 0), Vector2i(-1, 0), Vector2i(-1, -1), Vector2i(0, 2), Vector2i(-1, 2)],
		# 1→2
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(1, 1), Vector2i(0, -2), Vector2i(1, -2)],
		# 2→3
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, 2), Vector2i(1, 2)],
		# 3→0
		[Vector2i(0, 0), Vector2i(-1, 0), Vector2i(-1, 1), Vector2i(0, -2), Vector2i(-1, -2)],
	],
	"i_piece": [
		# 0→1
		[Vector2i(0, 0), Vector2i(-2, 0), Vector2i(1, 0), Vector2i(-2, 1), Vector2i(1, -2)],
		# 1→2
		[Vector2i(0, 0), Vector2i(-1, 0), Vector2i(2, 0), Vector2i(-1, -2), Vector2i(2, 1)],
		# 2→3
		[Vector2i(0, 0), Vector2i(2, 0), Vector2i(-1, 0), Vector2i(2, -1), Vector2i(-1, 2)],
		# 3→0
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(-2, 0), Vector2i(1, 2), Vector2i(-2, -1)],
	],
}

var piece_type: PieceType
var rotation: int = 0
var grid_pos: Vector2i  # Top-left of bounding box in grid coords

func _init(type: PieceType = PieceType.I, pos: Vector2i = Vector2i.ZERO) -> void:
	piece_type = type
	grid_pos = pos
	rotation = 0

## Get absolute cell positions in grid coordinates
func get_cells() -> Array:
	var offsets: Array = SHAPES[piece_type][rotation]
	var cells: Array = []
	for offset in offsets:
		cells.append(grid_pos + offset)
	return cells

## Get cells for a specific rotation without modifying state
func get_cells_at(rot: int, pos: Vector2i) -> Array:
	var offsets: Array = SHAPES[piece_type][rot]
	var cells: Array = []
	for offset in offsets:
		cells.append(pos + offset)
	return cells

## Get the color for this piece type
func get_color() -> Color:
	return COLORS[piece_type]

## Get wall kick offsets for current rotation → next rotation
func get_wall_kicks() -> Array:
	if piece_type == PieceType.I:
		return WALL_KICKS["i_piece"][rotation]
	elif piece_type == PieceType.O:
		return [Vector2i(0, 0)]  # O piece doesn't need wall kicks
	else:
		return WALL_KICKS["normal"][rotation]

## Advance rotation clockwise (returns new rotation index)
func next_rotation() -> int:
	return (rotation + 1) % 4
