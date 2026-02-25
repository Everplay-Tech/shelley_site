extends BaseEnemy
## Spidat — Spider/Bat chimera. Flying swooper.
## Sine-wave float in the air space above ground.
## Occupies jump space — forces Po to slide under.
## Cannot be stomped (ethereal wings, Po passes through from above).

@export var float_amplitude := 25.0  # Vertical wave size
@export var float_frequency := 2.5   # Wave speed

var _time := 0.0
var _base_y := 0.0

func _ready() -> void:
	super._ready()
	enemy_type = "spidat"
	can_stomp = false        # Can't stomp a flying enemy
	can_slide_defeat = true  # Slide under when it dips low
	defeat_score = 5         # Worth more — harder to defeat
	_base_y = position.y

func _update_movement(delta: float) -> void:
	_time += delta
	# Eerie sine-wave float
	position.y = _base_y + sin(_time * float_frequency) * float_amplitude
