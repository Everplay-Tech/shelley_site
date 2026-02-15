extends ParallaxBackground
## Scrolls the parallax layers to create the running effect.
## Po stays in place; the world moves.

@export var base_speed := 200.0
@export var narrative_speed := 30.0  # Slow scroll during narrative

var current_speed := 200.0
var target_speed := 200.0
var is_narrative := false

func _process(delta: float) -> void:
	# Smooth speed transitions
	current_speed = lerp(current_speed, target_speed, 5.0 * delta)
	scroll_offset.x -= current_speed * delta

func set_narrative_mode(enabled: bool) -> void:
	is_narrative = enabled
	target_speed = narrative_speed if enabled else base_speed

func pause() -> void:
	target_speed = 0.0

func resume() -> void:
	target_speed = narrative_speed if is_narrative else base_speed
