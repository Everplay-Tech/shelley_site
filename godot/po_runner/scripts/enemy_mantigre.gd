extends BaseEnemy
## Mantigre — Mantis/Tiger chimera. Ground charge encounter.
## State machine: APPROACH → CONFRONT (stand-off) → CHARGE (lunge at Po).
## World scrolling STOPS during the confrontation for a dramatic face-off.
##
## Rizky: Tune TRIGGER_X, CONFRONT_DURATION, CHARGE_SPEED for feel.
## Swap sprites, add "charge" animation for extra polish.

enum State { APPROACH, CONFRONT, CHARGE }

@export var approach_speed := 80.0     # Extra speed on top of world scroll

const TRIGGER_X := 400.0              # Screen x where confrontation triggers
const CONFRONT_DURATION := 1.5        # Stand-off duration (seconds)
const CHARGE_SPEED := 350.0           # Lunge speed toward Po
const BOB_SPEED_IDLE := 8.0           # Subtle bob during approach
const BOB_SPEED_CONFRONT := 12.0      # Aggressive bob during stand-off
const BOB_AMP_IDLE := 1.5             # Bob amplitude approach
const BOB_AMP_CONFRONT := 3.0         # Bob amplitude confrontation

var state := State.APPROACH
var _time := 0.0
var _confront_timer := 0.0
var _scroll_stop_emitted := false

func _ready() -> void:
	super._ready()
	enemy_type = "mantigre"
	can_stomp = true
	can_slide_defeat = true
	defeat_score = 3

func _update_movement(delta: float) -> void:
	_time += delta

	match state:
		State.APPROACH:
			# Close on Po faster than world scroll
			position.x -= approach_speed * delta
			# Subtle predatory bob
			position.y += sin(_time * BOB_SPEED_IDLE) * BOB_AMP_IDLE * delta
			# Trigger confrontation when visible on screen
			if position.x <= TRIGGER_X and not _scroll_stop_emitted:
				_enter_confront()

		State.CONFRONT:
			_confront_timer -= delta
			# Aggressive menacing bob — bigger, faster
			position.y += sin(_time * BOB_SPEED_CONFRONT) * BOB_AMP_CONFRONT * delta
			if _confront_timer <= 0.0:
				_enter_charge()

		State.CHARGE:
			# Full-speed lunge at Po
			position.x -= CHARGE_SPEED * delta

func _enter_confront() -> void:
	state = State.CONFRONT
	_confront_timer = CONFRONT_DURATION
	_scroll_stop_emitted = true
	request_scroll_stop.emit()
	# TODO: Rizky — play "confront" or "growl" animation if available
	# if sprite.sprite_frames.has_animation("confront"):
	#     sprite.play("confront")

func _enter_charge() -> void:
	state = State.CHARGE
	# TODO: Rizky — play "charge" animation if available
	# if sprite.sprite_frames.has_animation("charge"):
	#     sprite.play("charge")

func _die() -> void:
	super._die()
	# Ensure world resumes if killed during encounter
	if _scroll_stop_emitted:
		request_scroll_resume.emit()
