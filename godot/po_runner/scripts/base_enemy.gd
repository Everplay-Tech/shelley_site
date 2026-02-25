class_name BaseEnemy
extends Area2D
## Base enemy class — scrolls left, damages Po on contact, can be defeated.
## Enemies are Area2D (not StaticBody2D) to avoid pushback physics.
## Subclasses override _update_movement() for unique behavior.

signal enemy_defeated(enemy_type: String, pos: Vector2)
signal enemy_hit_po(enemy_type: String)
signal request_scroll_stop
signal request_scroll_resume

@export var scroll_speed := 200.0
@export var enemy_type := "unknown"
@export var defeat_score := 3       # Picks awarded on defeat
@export var can_stomp := true        # Can Po stomp this enemy?
@export var can_slide_defeat := true # Can Po slide through to defeat?

const STOMP_Y_THRESHOLD := 15.0     # How far above enemy Po must be for stomp
const STOMP_BOUNCE_FORCE := -300.0  # Po bounces up after stomp

var _defeated := false
var _hit := false

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D

func _ready() -> void:
	add_to_group("world_scrollable")
	sprite.play("move")

func _process(delta: float) -> void:
	if _defeated:
		return

	# Base scroll — world moves left
	position.x -= scroll_speed * delta

	# Subclass movement layered on top
	_update_movement(delta)

	# Despawn off-screen
	if position.x < -100:
		queue_free()

## Override in subclasses for unique movement patterns.
func _update_movement(_delta: float) -> void:
	pass

func _on_body_entered(body: Node2D) -> void:
	if _defeated or _hit:
		return

	# Slide defeat check
	if can_slide_defeat and body.get("is_sliding") == true:
		_die()
		if body.has_method("collect_pick"):
			body.collect_pick(defeat_score)
		if body.has_method("slide_defeat_flash"):
			body.slide_defeat_flash()
		return

	# Stomp check: Po falling + above enemy
	if can_stomp and body.get("velocity") != null:
		var vel: Vector2 = body.velocity
		if vel.y > 50 and body.global_position.y < global_position.y - STOMP_Y_THRESHOLD:
			_die()
			if body.has_method("collect_pick"):
				body.collect_pick(defeat_score)
			if body.has_method("stomp_bounce"):
				body.stomp_bounce()
			return

	# Otherwise — damage Po
	if body.has_method("stumble"):
		_hit = true
		body.stumble()
		enemy_hit_po.emit(enemy_type)

func _die() -> void:
	_defeated = true
	enemy_defeated.emit(enemy_type, global_position)

	# Play defeat animation if it exists
	if sprite.sprite_frames.has_animation("defeat"):
		sprite.play("defeat")
	else:
		# Fallback: flash and fade
		pass

	# Death tween: flash white, scale pop, fade out
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color(3.0, 3.0, 3.0, 1.0), 0.05)
	tween.tween_property(sprite, "modulate", Color(1.0, 1.0, 1.0, 1.0), 0.1)
	tween.tween_property(sprite, "scale", sprite.scale * 1.3, 0.08)
	tween.parallel().tween_property(sprite, "modulate:a", 0.0, 0.25)
	tween.tween_property(sprite, "scale", Vector2.ZERO, 0.1)
	tween.tween_callback(queue_free)
