extends BaseEnemy
## Mantigre — Mantis/Tiger chimera. Ground stalker.
## Runs along the ground FASTER than scroll speed, actively closing on Po.
## Slight vertical bob gives a predatory prowl feel.

@export var approach_speed := 80.0  # Extra speed on top of scroll

var _time := 0.0

func _ready() -> void:
	super._ready()
	enemy_type = "mantigre"
	can_stomp = true
	can_slide_defeat = true
	defeat_score = 3

func _update_movement(delta: float) -> void:
	_time += delta
	# Faster than world — actively closing on Po
	position.x -= approach_speed * delta
	# Subtle predatory bob
	position.y += sin(_time * 8.0) * 1.5 * delta
