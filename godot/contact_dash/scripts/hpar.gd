extends CharacterBody2D
## Hpar — samurai ronin protagonist for Contact Dash.
## Moves left/right only along bottom of screen. Catches envelopes.

signal envelope_entered(envelope: Area2D)

const MOVE_SPEED := 300.0
const MIN_X := 16.0
const MAX_X := 624.0

var _facing_right := true

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var catch_zone: Area2D = $CatchZone

func _ready() -> void:
	# Play idle if frames exist, otherwise add placeholder visual
	if sprite.sprite_frames and sprite.sprite_frames.has_animation("idle"):
		sprite.play("idle")
	else:
		_add_placeholder_visual()
	# Connect catch zone
	catch_zone.area_entered.connect(_on_catch_zone_area_entered)

func _add_placeholder_visual() -> void:
	# Samurai ronin silhouette placeholder until PixelLab sprites arrive
	# Body
	var body = ColorRect.new()
	body.name = "PlaceholderBody"
	body.size = Vector2(14, 22)
	body.color = Color(0.15, 0.15, 0.2, 0.9)  # Dark charcoal
	body.position = Vector2(-7, -24)
	add_child(body)
	# Hat (wide brim)
	var hat = ColorRect.new()
	hat.size = Vector2(20, 4)
	hat.color = Color(0.35, 0.25, 0.15, 0.9)  # Straw brown
	hat.position = Vector2(-10, -28)
	add_child(hat)
	# Mask accent
	var mask = ColorRect.new()
	mask.size = Vector2(8, 5)
	mask.color = Color(0.6, 0.1, 0.1, 0.8)  # Oni red
	mask.position = Vector2(-4, -22)
	add_child(mask)
	# Poncho
	var poncho = ColorRect.new()
	poncho.size = Vector2(18, 10)
	poncho.color = Color(0.25, 0.2, 0.35, 0.8)  # Dark purple-grey
	poncho.position = Vector2(-9, -16)
	add_child(poncho)

func _physics_process(_delta: float) -> void:
	var dir := 0.0

	# Keyboard input
	if Input.is_action_pressed("move_left"):
		dir -= 1.0
	if Input.is_action_pressed("move_right"):
		dir += 1.0

	# Touch input — tap left/right screen halves
	if dir == 0.0:
		for i in range(10):
			if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
				var vp = get_viewport()
				if vp:
					var mouse_pos = vp.get_mouse_position()
					if mouse_pos.x < 320:
						dir = -1.0
					else:
						dir = 1.0
				break

	velocity.x = dir * MOVE_SPEED
	velocity.y = 0

	move_and_slide()

	# Clamp position
	position.x = clamp(position.x, MIN_X, MAX_X)

	# Animation (safe — sprites may not be loaded yet)
	var has_frames = sprite.sprite_frames != null
	if dir != 0:
		if has_frames and sprite.sprite_frames.has_animation("walk"):
			if sprite.animation != "walk":
				sprite.play("walk")
		sprite.flip_h = dir < 0
		_facing_right = dir > 0
	else:
		if has_frames and sprite.sprite_frames.has_animation("idle"):
			if sprite.animation != "idle":
				sprite.play("idle")

func _on_catch_zone_area_entered(area: Area2D) -> void:
	envelope_entered.emit(area)
