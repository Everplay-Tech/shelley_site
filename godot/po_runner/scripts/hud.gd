extends CanvasLayer
## HUD — spirit phone bar (health), distance, score, trophy tracker, artifact tracker, game over panel.
## Po is immortal — when his spirit energy runs out, he has to call his mom.
## Artifact system: 6 slots for the Forbidden Six — Exodia/Vecna-style collectible set.
## Brand colors: wood=#4a3728, amber=#ffbf00, charcoal=#1a1a1a.

signal restart_requested
signal all_pieces_collected

# ---- Spirit Bar Colors ----
const BAR_FULL := Color(0.4, 0.85, 1.0, 0.9)       # Spectral cyan at full
const BAR_MID := Color(1.0, 0.749, 0.0, 0.9)        # Amber at half
const BAR_LOW := Color(1.0, 0.3, 0.2, 0.9)           # Red at low
const BAR_EMPTY := Color(0.15, 0.15, 0.15, 0.5)      # Dark empty
const BAR_FLASH := Color(1.0, 1.0, 1.0, 1.0)         # White flash on damage
const BAR_HEAL := Color(0.4, 1.0, 0.6, 1.0)          # Green flash on heal
const BAR_BG := Color(0.08, 0.08, 0.08, 0.7)         # Background

# Bar dimensions
const BAR_WIDTH := 80.0
const BAR_HEIGHT := 8.0
const BAR_X := 10.0
const BAR_Y := 10.0

# Health state
var max_health := 5
var _prev_health := 5
var _bar_bg: ColorRect
var _bar_label: Label
var _bar_segments: Array[ColorRect] = []

const WOOD_COLOR := Color(0.29, 0.216, 0.157, 1.0)  # #4a3728
const AMBER_COLOR := Color(1.0, 0.749, 0.0, 1.0)    # #ffbf00
const CHARCOAL := Color(0.1, 0.1, 0.1, 1.0)         # #1a1a1a

# ---- Artifact Tracker (Forbidden Six) ----
const ARTIFACT_TOTAL := 6
const ARTIFACT_SLOT_SIZE := 10.0
const ARTIFACT_GAP := 3.0
const ARTIFACT_EMPTY_COLOR := Color(0.15, 0.12, 0.08, 0.3)
const ARTIFACT_FILL_COLOR := Color(1.0, 0.749, 0.0, 0.9)      # Golden amber
const ARTIFACT_PULSE_COLOR := Color(1.0, 0.9, 0.6, 1.0)       # Bright pulse
const ARTIFACT_GLOW_COLOR := Color(1.0, 0.85, 0.4, 0.4)       # Ambient glow around filled
var _artifact_count := 0
var _artifact_slots: Array[ColorRect] = []
var _artifact_glows: Array[ColorRect] = []
var _artifact_label: Label
var _artifact_bg: ColorRect

var _game_over_visible := false
var _trophies: Dictionary = {}  # food_name → {node, count_label, count}

# MGS Codec-style dialogue system
var _speaker_label: Label = null
var _codec_border_top: ColorRect = null
var _codec_border_bottom: ColorRect = null
var _codec_accent: ColorRect = null
var _codec_built := false
const SPEAKER_COLORS := {
	"Po": Color(1.0, 0.749, 0.0, 0.9),       # Amber for Po
	"Magus": Color(0.4, 0.85, 0.6, 0.9),      # Green for Magus (codec green)
}

@onready var heart_container: HBoxContainer = $HeartContainer  # Repurposed as bar anchor
@onready var distance_label: Label = $DistanceLabel
@onready var score_panel: HBoxContainer = $ScorePanel
@onready var score_label: Label = $ScorePanel/ScoreLabel
@onready var trophy_container: HBoxContainer = $TrophyContainer
@onready var game_over_panel: PanelContainer = $GameOverPanel
@onready var game_over_score: Label = $GameOverPanel/VBox/ScoreValue
@onready var game_over_distance: Label = $GameOverPanel/VBox/DistanceValue
@onready var game_over_tap: Label = $GameOverPanel/VBox/TapLabel
@onready var game_over_title: Label = $GameOverPanel/VBox/Title
@onready var danger_vignette: ColorRect = $DangerVignette

func _ready() -> void:
	# Hide the old heart container (we build bar elements manually)
	heart_container.visible = false

	# Build spirit bar (replaces hearts)
	_build_spirit_bar(max_health)

	# Build artifact tracker (Forbidden Six slots)
	_build_artifact_tracker()

	# Hide game over panel
	game_over_panel.visible = false
	danger_vignette.visible = false

	# Start blinking game over label
	_blink_tap_label()

func _input(event: InputEvent) -> void:
	if not _game_over_visible:
		return
	if event is InputEventScreenTouch and event.pressed:
		restart_requested.emit()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("jump") or event.is_action_pressed("advance"):
		restart_requested.emit()
		get_viewport().set_input_as_handled()

# ---- Spirit Bar (Health) ----

func _build_spirit_bar(max_val: int) -> void:
	# Clean up old bar elements
	if _bar_bg:
		_bar_bg.queue_free()
	for seg in _bar_segments:
		seg.queue_free()
	_bar_segments.clear()
	if _bar_label:
		_bar_label.queue_free()

	max_health = max_val
	_prev_health = max_val

	# Wider bar for NG+ (7 HP)
	var bar_w: float = BAR_WIDTH if max_val <= 5 else 105.0

	# Label
	_bar_label = Label.new()
	_bar_label.text = "SPIRIT"
	_bar_label.position = Vector2(BAR_X, BAR_Y - 2)
	_bar_label.add_theme_font_size_override("font_size", 7)
	_bar_label.add_theme_color_override("font_color", Color(0.5, 0.7, 0.9, 0.5))
	add_child(_bar_label)

	# Background
	_bar_bg = ColorRect.new()
	_bar_bg.size = Vector2(bar_w + 4, BAR_HEIGHT + 4)
	_bar_bg.position = Vector2(BAR_X - 2, BAR_Y + 8)
	_bar_bg.color = BAR_BG
	add_child(_bar_bg)

	# Segments — one per HP, with 1px gap between
	var seg_gap := 1.5
	var seg_w: float = (bar_w - seg_gap * (max_val - 1)) / max_val
	for i in range(max_val):
		var seg = ColorRect.new()
		seg.size = Vector2(seg_w, BAR_HEIGHT)
		seg.position = Vector2(BAR_X + i * (seg_w + seg_gap), BAR_Y + 10)
		seg.color = _bar_color_for_health(max_val, max_val)
		add_child(seg)
		_bar_segments.append(seg)

func _bar_color_for_health(current: int, max_val: int) -> Color:
	var ratio: float = float(current) / float(max_val)
	if ratio > 0.6:
		return BAR_FULL
	elif ratio > 0.3:
		return BAR_MID.lerp(BAR_FULL, (ratio - 0.3) / 0.3)
	else:
		return BAR_LOW.lerp(BAR_MID, ratio / 0.3)

func update_hearts(current: int, max_val: int) -> void:
	# API name kept for backward compat with main.gd signal connection
	# Rebuild if max changed (NG+ activation)
	if max_val != max_health:
		_build_spirit_bar(max_val)
		_prev_health = max_val

	var fill_color: Color = _bar_color_for_health(current, max_val)
	for i in range(max_health):
		if i < current:
			# Filled segment
			if i >= _prev_health:
				# Newly healed — green flash
				_flash_segment(i, BAR_HEAL, fill_color)
			else:
				_bar_segments[i].color = fill_color
		else:
			# Empty segment
			if i < _prev_health:
				# Newly damaged — white flash
				_flash_segment(i, BAR_FLASH, BAR_EMPTY)
			else:
				_bar_segments[i].color = BAR_EMPTY
	_prev_health = current

	# Pulse entire bar red when critically low
	if current == 1 and current > 0:
		_pulse_critical()

func _flash_segment(idx: int, flash_color: Color, end_color: Color) -> void:
	var seg = _bar_segments[idx]
	seg.color = flash_color
	var tween: Tween = create_tween()
	tween.tween_property(seg, "color", end_color, 0.25)

func _pulse_critical() -> void:
	if _bar_segments.size() > 0:
		var seg = _bar_segments[0]
		var pulse: Tween = create_tween().set_loops(3)
		pulse.tween_property(seg, "color", Color(1.0, 0.1, 0.1, 1.0), 0.15)
		pulse.tween_property(seg, "color", BAR_LOW, 0.15)

# ---- Score & Distance ----

func update_score(value: int) -> void:
	score_label.text = str(value)

func update_distance(meters: int) -> void:
	distance_label.text = "%dm" % meters

# ---- Trophy Tracker ----

func add_trophy(food_name: String) -> void:
	if food_name == "":
		return
	if _trophies.has(food_name):
		var t = _trophies[food_name]
		t["count"] += 1
		t["count_label"].text = "x%d" % t["count"]
		var node: HBoxContainer = t["node"]
		var tween: Tween = create_tween()
		tween.tween_property(node, "scale", Vector2(1.2, 1.2), 0.06)
		tween.tween_property(node, "scale", Vector2(1.0, 1.0), 0.1)
	else:
		var entry = HBoxContainer.new()
		entry.add_theme_constant_override("separation", 1)

		var icon = ColorRect.new()
		icon.custom_minimum_size = Vector2(8, 8)
		icon.size = Vector2(8, 8)
		icon.color = _trophy_color(food_name)
		entry.add_child(icon)

		var count_lbl = Label.new()
		count_lbl.text = "x1"
		count_lbl.add_theme_font_size_override("font_size", 8)
		entry.add_child(count_lbl)

		trophy_container.add_child(entry)
		_trophies[food_name] = {"node": entry, "count_label": count_lbl, "count": 1}

		entry.scale = Vector2.ZERO
		entry.pivot_offset = Vector2(12, 6)
		var tween: Tween = create_tween()
		tween.tween_property(entry, "scale", Vector2(1.3, 1.3), 0.08)
		tween.tween_property(entry, "scale", Vector2(1.0, 1.0), 0.12)

func _trophy_color(food_name: String) -> Color:
	match food_name:
		"ramen": return Color(0.9, 0.75, 0.3, 1.0)
		"toaster_strudel": return Color(0.85, 0.65, 0.4, 1.0)
		"coffee": return Color(0.55, 0.35, 0.2, 1.0)
		"cavatappi": return Color(0.95, 0.85, 0.5, 1.0)
		"blt": return Color(0.8, 0.3, 0.2, 1.0)
		"smoothie": return Color(0.5, 0.8, 0.4, 1.0)
		_: return AMBER_COLOR

# ---- Artifact Tracker (Forbidden Six) ----

func _build_artifact_tracker() -> void:
	var vp_w = get_viewport().get_visible_rect().size.x
	var total_w = ARTIFACT_TOTAL * ARTIFACT_SLOT_SIZE + (ARTIFACT_TOTAL - 1) * ARTIFACT_GAP
	var start_x = vp_w - total_w - 10  # 10px right margin

	# Label
	_artifact_label = Label.new()
	_artifact_label.text = "???"
	_artifact_label.position = Vector2(start_x, 4)
	_artifact_label.add_theme_font_size_override("font_size", 6)
	_artifact_label.add_theme_color_override("font_color", Color(0.6, 0.5, 0.3, 0.4))
	add_child(_artifact_label)

	# Background
	_artifact_bg = ColorRect.new()
	_artifact_bg.size = Vector2(total_w + 6, ARTIFACT_SLOT_SIZE + 6)
	_artifact_bg.position = Vector2(start_x - 3, 13)
	_artifact_bg.color = Color(0.05, 0.05, 0.05, 0.5)
	add_child(_artifact_bg)

	# Slots
	for i in range(ARTIFACT_TOTAL):
		# Glow layer (behind slot, larger, invisible until filled)
		var glow = ColorRect.new()
		glow.size = Vector2(ARTIFACT_SLOT_SIZE + 4, ARTIFACT_SLOT_SIZE + 4)
		glow.position = Vector2(start_x + i * (ARTIFACT_SLOT_SIZE + ARTIFACT_GAP) - 2, 14)
		glow.color = ARTIFACT_GLOW_COLOR
		glow.modulate.a = 0.0
		add_child(glow)
		_artifact_glows.append(glow)

		# Slot
		var slot = ColorRect.new()
		slot.size = Vector2(ARTIFACT_SLOT_SIZE, ARTIFACT_SLOT_SIZE)
		slot.position = Vector2(start_x + i * (ARTIFACT_SLOT_SIZE + ARTIFACT_GAP), 16)
		slot.color = ARTIFACT_EMPTY_COLOR
		add_child(slot)
		_artifact_slots.append(slot)

func collect_artifact() -> void:
	## Called by main.gd when a boss drops and Po collects an artifact piece.
	if _artifact_count >= ARTIFACT_TOTAL:
		return

	var idx = _artifact_count
	_artifact_count += 1

	# Fill the slot with dramatic animation
	var slot = _artifact_slots[idx]
	var glow = _artifact_glows[idx]

	# Flash white → golden amber
	slot.color = Color(3.0, 2.5, 1.5, 1.0)  # Overbright flash
	var tween: Tween = create_tween()
	tween.tween_property(slot, "color", ARTIFACT_FILL_COLOR, 0.3)

	# Scale pop
	var orig_size = slot.size
	slot.size = orig_size * 1.8
	slot.position -= (orig_size * 0.4)
	tween.parallel().tween_property(slot, "size", orig_size, 0.25)
	tween.parallel().tween_property(slot, "position", slot.position + (orig_size * 0.4), 0.25)

	# Glow fade in
	glow.modulate.a = 0.8
	var glow_tween: Tween = create_tween()
	glow_tween.tween_property(glow, "modulate:a", 0.3, 0.5)

	# Update label
	_artifact_label.text = "%d / %d" % [_artifact_count, ARTIFACT_TOTAL]
	_artifact_label.add_theme_color_override("font_color", Color(0.8, 0.65, 0.3, 0.7))

	# Cumulative effects based on piece count
	_update_artifact_ambience()

	# Check for completion
	if _artifact_count >= ARTIFACT_TOTAL:
		_on_all_artifacts_collected()

func _update_artifact_ambience() -> void:
	## Escalating visual effects as more pieces are collected.
	match _artifact_count:
		3:
			# All filled slots start gentle pulse
			for i in range(_artifact_count):
				_start_slot_pulse(_artifact_slots[i], 2.0)
		5:
			# Intense pulse — reality shaking
			for i in range(_artifact_count):
				_start_slot_pulse(_artifact_slots[i], 0.8)
			# Glows intensify
			for i in range(_artifact_count):
				_artifact_glows[i].modulate.a = 0.5

func _start_slot_pulse(slot: ColorRect, period: float) -> void:
	var pulse: Tween = create_tween().set_loops()
	pulse.tween_property(slot, "color", ARTIFACT_PULSE_COLOR, period * 0.5)
	pulse.tween_property(slot, "color", ARTIFACT_FILL_COLOR, period * 0.5)

func _on_all_artifacts_collected() -> void:
	## All 6 pieces collected — trigger the morph sequence.
	# All slots pulse rapidly
	for slot in _artifact_slots:
		var rapid: Tween = create_tween().set_loops(5)
		rapid.tween_property(slot, "color", Color(3.0, 2.5, 1.0, 1.0), 0.08)
		rapid.tween_property(slot, "color", ARTIFACT_FILL_COLOR, 0.08)

	# All glows max out
	for glow in _artifact_glows:
		glow.modulate.a = 0.9

	# Label flash
	_artifact_label.text = "COMPLETE"
	_artifact_label.add_theme_color_override("font_color", AMBER_COLOR)

	# Emit signal after brief dramatic pause
	var timer: Tween = create_tween()
	timer.tween_interval(1.0)
	timer.tween_callback(func(): all_pieces_collected.emit())

func get_artifact_count() -> int:
	return _artifact_count

# ---- Game Over Panel ----

func show_game_over(final_score: int, final_distance: int) -> void:
	_game_over_visible = true
	game_over_title.text = "GOTTA CALL MOM"
	game_over_score.text = str(final_score)
	game_over_distance.text = "%dm" % final_distance
	game_over_tap.text = "TAP BEFORE SHE PICKS UP"
	game_over_panel.visible = true
	game_over_panel.modulate.a = 0.0
	var tween: Tween = create_tween()
	tween.tween_property(game_over_panel, "modulate:a", 1.0, 0.5)

func _blink_tap_label() -> void:
	if not is_inside_tree():
		return
	var tween: Tween = create_tween().set_loops()
	tween.tween_property(game_over_tap, "modulate:a", 0.2, 0.5)
	tween.tween_property(game_over_tap, "modulate:a", 1.0, 0.5)

# ---- Danger Vignette (attack telegraph) ----

func flash_danger() -> void:
	danger_vignette.modulate.a = 0.0
	danger_vignette.visible = true
	var tween: Tween = create_tween()
	tween.tween_property(danger_vignette, "modulate:a", 0.2, 0.08)
	tween.tween_property(danger_vignette, "modulate:a", 0.0, 0.3)
	tween.tween_callback(func(): danger_vignette.visible = false)

# ---- MGS Codec Dialogue System ----

func _build_codec_overlay() -> void:
	## Builds Metal Gear Solid-style codec frame around the SpeechBubble.
	## Called once on first dialogue trigger. Modifies SpeechBubble styling in-place.
	if _codec_built:
		return
	_codec_built = true

	var bubble = %SpeechBubble as PanelContainer

	# Restyle the panel — dark codec background
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.03, 0.04, 0.06, 0.92)  # Near-black with slight blue
	style.border_width_top = 1
	style.border_width_bottom = 1
	style.border_width_left = 1
	style.border_width_right = 1
	style.border_color = Color(0.3, 0.6, 0.45, 0.5)  # Muted codec green border
	style.corner_radius_top_left = 2
	style.corner_radius_top_right = 2
	style.corner_radius_bottom_left = 2
	style.corner_radius_bottom_right = 2
	bubble.add_theme_stylebox_override("panel", style)

	# Reposition: wider, lower — classic codec bar across bottom
	bubble.offset_left = 30.0
	bubble.offset_right = 610.0
	bubble.offset_top = 250.0
	bubble.offset_bottom = 340.0

	# Speaker name label — top-left inside codec frame
	_speaker_label = Label.new()
	_speaker_label.position = Vector2(8, -14)  # Sits above the panel top edge
	_speaker_label.add_theme_font_size_override("font_size", 8)
	_speaker_label.add_theme_color_override("font_color", Color(0.4, 0.85, 0.6, 0.9))
	_speaker_label.visible = false
	bubble.add_child(_speaker_label)

	# Accent bar — thin colored line under speaker name
	_codec_accent = ColorRect.new()
	_codec_accent.size = Vector2(50, 1)
	_codec_accent.position = Vector2(8, -3)
	_codec_accent.color = Color(0.4, 0.85, 0.6, 0.4)
	_codec_accent.visible = false
	bubble.add_child(_codec_accent)

	# Scanline overlay — faint horizontal lines for CRT feel
	var scanlines = ColorRect.new()
	scanlines.size = Vector2(580, 90)
	scanlines.position = Vector2(0, 0)
	scanlines.color = Color(0.0, 0.0, 0.0, 0.04)  # Very faint
	scanlines.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bubble.add_child(scanlines)

	# Style the text label — codec green/white monospace feel
	var label = %SpeechLabel as RichTextLabel
	label.add_theme_color_override("default_color", Color(0.85, 0.9, 0.85, 1.0))
	label.add_theme_font_size_override("normal_font_size", 10)

func update_speaker(speaker_name: String) -> void:
	## Called when narrative emits speaker_changed signal.
	if not _codec_built:
		_build_codec_overlay()
	if _speaker_label:
		_speaker_label.text = speaker_name
		_speaker_label.visible = true
		var color = SPEAKER_COLORS.get(speaker_name, Color(0.8, 0.8, 0.8, 0.8))
		_speaker_label.add_theme_color_override("font_color", color)
		# Accent bar matches speaker color
		if _codec_accent:
			_codec_accent.color = Color(color.r, color.g, color.b, 0.4)
			_codec_accent.size.x = speaker_name.length() * 6.0 + 10
			_codec_accent.visible = true

func hide_speaker() -> void:
	## Called when narrative beat ends.
	if _speaker_label:
		_speaker_label.visible = false
	if _codec_accent:
		_codec_accent.visible = false
