extends StaticBody2D
## An obstacle that scrolls left. Randomly selects visual variant.
## Variants: bamboo stump, rock, mechanical debris.

@export var scroll_speed := 200.0

var _hit := false

const TEXTURES = [
	preload("res://sprites/objects/obstacle_bamboo.png"),
	preload("res://sprites/objects/obstacle_rock.png"),
	preload("res://sprites/objects/obstacle_mech.png"),
]

func _ready() -> void:
	add_to_group("world_scrollable")
	# Random visual variant
	$Sprite2D.texture = TEXTURES[randi() % TEXTURES.size()]

func _process(delta: float) -> void:
	position.x -= scroll_speed * delta
	if position.x < -100:
		queue_free()

func _on_hit_area_body_entered(body: Node2D) -> void:
	if _hit:
		return
	if body.has_method("stumble"):
		_hit = true
		body.stumble()
