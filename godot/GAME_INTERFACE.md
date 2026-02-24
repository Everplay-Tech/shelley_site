# Shelley Site — Game Interface Standard

Every Godot game that plugs into the Shelley Site must follow this contract.

## Quick Start

1. Copy `shared/web_bridge.gd` into your game's `scripts/` folder
2. Add a `WebBridge` Node to your main scene, attach the script
3. Call `web_bridge.send_game_ready()` in your main scene's `_ready()`
4. Call `web_bridge.send_minigame_complete(score, skipped)` when the game ends
5. Handle `start`, `pause`, `resume` commands via `web_bridge.host_command_received` signal
6. Export to `web/public/games/{your_game_name}/index.html`

## Required Events (Game → Host)

| Event | When | Data |
|-------|------|------|
| `game_ready` | On `_ready()` | None |
| `minigame_complete` | Game finished | `{ score: int, skipped: bool }` |
| `game_error` | Unrecoverable error | `{ message: string }` |

## Required Commands (Host → Game)

| Command | Action | Data |
|---------|--------|------|
| `start` | Begin gameplay | `{ level?: string }` |
| `pause` | Pause the game | None |
| `resume` | Resume the game | None |

## Optional Events

| Event | When | Data |
|-------|------|------|
| `player_state` | Periodic (every ~2s) | `{ mood, score, action }` |
| `narrative_start` | Dialogue begins | `{ beatId: string }` |
| `narrative_end` | Dialogue ends | `{ beatId: string }` |
| `onboarding_complete` | Story finished | None |
| `score_update` | Score changes | `{ score, picks, distance }` |

## Optional Commands

| Command | Action | Data |
|---------|--------|------|
| `config` | Player profile | `{ relationshipLevel, gamesPlayed, fourthWallUnlocked, features }` |
| `move_to` | Navigation hint | `{ target: string }` |

The `config` command is sent by the host right after receiving `game_ready`.
Use it to customize behavior based on the player's history (optional).

## Export Settings

- Platform: Web (single-threaded)
- Renderer: GL Compatibility
- Thread support: `variant/thread_support=0`
- Export path: `../../web/public/games/{game_name}/index.html`
- After export: Change `ensureCrossOriginIsolationHeaders` to `false` in the exported HTML

## File Structure

```
godot/{game_name}/
├── project.godot
├── export_presets.cfg
├── scenes/
│   └── main.tscn          # Root scene
├── scripts/
│   ├── main.gd            # Game controller
│   └── web_bridge.gd      # Copy from shared/
├── sprites/
│   └── ...
└── data/
    └── narrative_beats.json  # Optional
```
