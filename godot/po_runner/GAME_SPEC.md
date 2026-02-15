# Po Runner — Game Design Spec

## Overview
An endless runner that serves as the onboarding experience for first-time visitors to shelleyguitar.com. Po (pixel-art character in a green hoodie) runs through a side-scrolling world, dodging obstacles. The game pauses at narrative beat points where Po talks to the player via text bubbles. When the onboarding is complete, the game signals the website and a cookie is set so the player gets a different game (po_moped) next visit.

## Visual Style
- **Pixel art** — 16-bit era aesthetic, clean and readable
- **Side-scrolling** — camera follows Po left-to-right
- **Color palette:** dark backgrounds (charcoal #1a1a1a), warm accents (amber #ffbf00, wood #4a3728)
- **Parallax layers:** background (mountains/sky), midground (workshop buildings, trees), foreground (ground, obstacles)
- **Resolution:** 640x360 native, scaled up. Fits 16:9 aspect ratio in the iframe.

## Character: Po
- Small pixel character, green hoodie, runs automatically (auto-runner)
- **Actions:** jump (tap/space), double-jump, slide (down/S)
- **Idle animation:** breathing, looking around
- **Run animation:** 4-6 frame cycle
- **Jump animation:** arms up, hoodie flaps
- **Narrative pose:** stops running, turns to face camera, speech bubble appears

## World / Environment
The run passes through themed zones that preview the site sections:

1. **Workshop Zone** — sawdust particles, workbenches in background, wood planks as platforms
2. **Gallery Zone** — guitar silhouettes hanging in background, spotlights, polished floor
3. **Forest/Nature Zone** — trees, outdoor feel, leads to the "about" vibe

Zones blend into each other — no hard cuts. The environment tells the story before Po says anything.

## Obstacles
- **Wood scraps** — small, jump over
- **Guitar cases** — medium, jump or slide
- **Workbench** — tall, must slide under
- **Falling sawdust piles** — telegraphed with particle warning, must dodge
- Keep it forgiving — this is onboarding, not Dark Souls. Hitting an obstacle = Po stumbles and loses a beat, but doesn't die. No game over state during onboarding.

## Collectibles
- **Guitar picks** — scattered along the path, Po auto-collects nearby ones
- **Golden picks** — rare, worth more, placed in tricky spots
- Score displayed in top-right corner
- Score is sent to the website via postMessage (player_state event)

## Narrative System

### How It Works
At specific distance milestones, the game triggers a narrative pause:

1. Po decelerates and stops
2. World keeps scrolling slowly (parallax continues at reduced speed for atmosphere)
3. Po turns to face the camera
4. A pixel-art speech bubble appears above Po
5. Text types out character-by-character (typewriter effect)
6. Player clicks/taps or presses Space to advance to next line
7. When the beat is done, Po turns forward and accelerates back to running speed

### Narrative Beats (5-7 planned, placeholder text)

**Beat 1 — Introduction** (triggers at ~200m)
```
"DIALOGUE HERE"
```
*Context: Po introduces himself. First pause, teaches the player that the game will pause for story.*

**Beat 2 — The Workshop** (triggers at ~600m, during Workshop Zone)
```
"DIALOGUE HERE"
```
*Context: Po talks about the workshop, guitar building, what Shelley does.*

**Beat 3 — The Gallery** (triggers at ~1200m, during Gallery Zone)
```
"DIALOGUE HERE"
```
*Context: Po shows off the gallery, the guitars, the craft.*

**Beat 4 — The Invitation** (triggers at ~1800m)
```
"DIALOGUE HERE"
```
*Context: Po invites the player to explore the site freely. This is the final beat.*

**Beat 5 — Onboarding Complete** (triggers at ~2000m)
```
"DIALOGUE HERE"
```
*Context: Short goodbye. After this, the game sends `onboarding_complete` to the website and the run continues as a freeplay endless runner (no more pauses) until the player navigates away.*

### Dialogue Data Structure
All dialogue lives in a single resource file so it's easy to swap:

```gdscript
# res://data/narrative_beats.gd or .json

var beats = [
    {
        "id": "intro",
        "trigger_distance": 200,
        "lines": [
            "DIALOGUE HERE",
            "DIALOGUE HERE"
        ]
    },
    {
        "id": "workshop",
        "trigger_distance": 600,
        "lines": [
            "DIALOGUE HERE"
        ]
    },
    {
        "id": "gallery",
        "trigger_distance": 1200,
        "lines": [
            "DIALOGUE HERE"
        ]
    },
    {
        "id": "invitation",
        "trigger_distance": 1800,
        "lines": [
            "DIALOGUE HERE"
        ]
    },
    {
        "id": "complete",
        "trigger_distance": 2000,
        "lines": [
            "DIALOGUE HERE"
        ],
        "signal": "onboarding_complete"
    }
]
```

## PostMessage Protocol (Godot → Website)

The game communicates with the host website through JavaScript's `postMessage`. In Godot, use `JavaScriptBridge.eval()` to send messages to `window.parent`.

### Events to Send:

**game_ready** — When the game has loaded and is ready to play
```json
{ "type": "game_ready" }
```

**player_state** — Periodically (every ~2 seconds) during gameplay
```json
{
    "type": "player_state",
    "data": {
        "mood": "Running",
        "score": 42,
        "action": "Jumping"
    }
}
```

**narrative_start** — When a narrative pause begins
```json
{
    "type": "narrative_start",
    "data": { "beatId": "workshop" }
}
```

**narrative_end** — When a narrative pause ends and running resumes
```json
{
    "type": "narrative_end",
    "data": { "beatId": "workshop" }
}
```

**onboarding_complete** — After the final narrative beat. This is the critical one — the website sets a cookie when it receives this.
```json
{ "type": "onboarding_complete" }
```

**minigame_complete** — If the game is used as a transition (not on the landing page)
```json
{
    "type": "minigame_complete",
    "data": { "score": 150, "skipped": false }
}
```

### GDScript postMessage Helper:
```gdscript
func send_to_host(data: Dictionary) -> void:
    if OS.has_feature("web"):
        var json = JSON.stringify(data)
        JavaScriptBridge.eval("window.parent.postMessage(%s, '*')" % json)
```

## Commands from Website (Website → Godot)

The website can send commands via postMessage. Listen for them with:

```gdscript
func _ready():
    if OS.has_feature("web"):
        JavaScriptBridge.eval("""
            window.addEventListener('message', function(e) {
                var data = JSON.stringify(e.data);
                // Call Godot function via the engine instance
                window.gameInstance.postMessage(data);
            });
        """)
```

Commands the game should handle:
- `{ "command": "start" }` — Begin the run
- `{ "command": "pause" }` — Pause the game
- `{ "command": "resume" }` — Resume from pause

## Export Settings
- **Platform:** Web / HTML5
- **Single-threaded:** Yes (no SharedArrayBuffer needed)
- **Output files:** `index.html`, `po_runner.wasm`, `po_runner.pck`
- **Export to:** `web/public/games/po_runner/`
- **Canvas resize policy:** Viewport (fixed 640x360, CSS scales to fill container)

## File Structure in Godot
```
godot/po_runner/
├── project.godot
├── scenes/
│   ├── main.tscn          # Main game scene
│   ├── po.tscn            # Po character scene
│   ├── obstacle.tscn      # Obstacle base scene
│   └── speech_bubble.tscn # Narrative UI
├── scripts/
│   ├── main.gd            # Game loop, spawning, narrative triggers
│   ├── po.gd              # Character controller
│   ├── obstacle.gd        # Obstacle behavior
│   ├── speech_bubble.gd   # Typewriter text, advance on input
│   ├── web_bridge.gd      # postMessage send/receive
│   └── narrative.gd       # Beat triggers, dialogue data
├── data/
│   └── narrative_beats.json # All dialogue text (easy to swap)
├── sprites/
│   ├── po/                # Po sprite sheets
│   ├── obstacles/         # Obstacle sprites
│   ├── environment/       # Background layers
│   └── ui/                # Speech bubble, picks, score
├── audio/                 # SFX (jump, collect, stumble)
└── export_presets.cfg     # Web export config
```

## Priority Order for Rizky
1. **Po running + jumping** — Get the character moving with basic physics
2. **Scrolling world** — Parallax background, ground tiles
3. **Obstacles** — Spawning, collision, stumble animation
4. **Collectibles** — Guitar picks, score
5. **Narrative system** — Pause, speech bubble, typewriter text, advance on input
6. **Web bridge** — postMessage integration
7. **Polish** — Particles, sound, screen shake, zone transitions
