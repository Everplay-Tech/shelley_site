# Shelley Guitar — Implementation Guide

> **Repository:** Everplay-Tech/shelley_site
> **Stack:** Next.js 14.2.35 (App Router) | TypeScript | Tailwind CSS | Godot 4.3+ Web Embeds
> **Hosting:** Railway (auto-deploy from master) | GoDaddy (domain)
> **Live:** https://www.shelleyguitar.com

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [The Concept](#the-concept)
4. [Godot Bridge Protocol](#godot-bridge-protocol)
5. [Game Routing & Transitions](#game-routing--transitions)
6. [Zone System](#zone-system)
7. [Landing Page & Onboarding](#landing-page--onboarding)
8. [Player State & Session Management](#player-state--session-management)
9. [Database Schema](#database-schema)
10. [API Routes](#api-routes)
11. [Rewards System](#rewards-system)
12. [Narrative CMS](#narrative-cms)
13. [Design System](#design-system)
14. [SEO & Metadata](#seo--metadata)
15. [Deployment](#deployment)
16. [Environment Variables](#environment-variables)
17. [Critical Gotchas](#critical-gotchas)

---

## Architecture Overview

The site operates as a hybrid web-app/game-world. A Next.js frontend serves as the "world map" while Godot 4.3+ HTML5 exports run inside iframes as interactive mini-games. The two layers communicate via a typed PostMessage bridge protocol.

```
┌─────────────────────────────────────────────────────┐
│  Next.js App Router (React 18)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Layout   │  │ Zone     │  │ TransitionContext │  │
│  │ (header, │  │ Pages    │  │ (overlay mgr)    │  │
│  │ footer,  │  │          │  └────────┬─────────┘  │
│  │ JSON-LD) │  │ workshop │           │             │
│  └──────────┘  │ gallery  │  ┌────────▼─────────┐  │
│                │ libraryn │  │ MiniGameTransition│  │
│                │ contact  │  │ (full-screen)     │  │
│                └──────────┘  └────────┬─────────┘  │
│                                       │             │
│  ┌────────────────────────────────────▼──────────┐  │
│  │ GodotEmbed (iframe)                           │  │
│  │   src="/games/{gameName}/index.html"           │  │
│  │   PostMessage ↕ useGodotBridge                │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │ player-state│  │ game-events│  │ game-routes  │  │
│  │ (session +  │  │ (emitter)  │  │ (route→game) │  │
│  │ progress)   │  │            │  │              │  │
│  └──────┬──────┘  └────────────┘  └──────────────┘  │
│         │                                           │
│  ┌──────▼──────────────────────────────────────┐    │
│  │ API Routes (/api/session, /game-event, etc) │    │
│  └──────┬──────────────────────────────────────┘    │
│         │                                           │
│  ┌──────▼──────┐                                    │
│  │ PostgreSQL  │  (Railway-managed)                 │
│  └─────────────┘                                    │
└─────────────────────────────────────────────────────┘
```

---

## Project Structure

```
shelley_site/
├── railway.toml               # Railway build + deploy config
├── IMPLEMENTATION.md           # This file
├── godot/                      # Godot source projects (built separately)
│   ├── po_runner/              # Main onboarding game
│   ├── contact_dash/           # Contact zone transition game
│   ├── gallery_run/            # Gallery zone transition game
│   └── ...
└── web/                        # Next.js application
    ├── package.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── public/
    │   ├── games/              # Godot HTML5 exports (static)
    │   │   ├── po_runner/
    │   │   ├── contact_dash/
    │   │   ├── gallery_run/
    │   │   └── ...
    │   ├── fonts/
    │   │   └── press-start-2p.woff2
    │   └── sprites/
    │       └── po/
    │           └── idle_sheet.png
    └── src/
        ├── app/
        │   ├── layout.tsx              # Root layout, metadata, JSON-LD
        │   ├── page.tsx                # Landing page (po_runner)
        │   ├── robots.ts               # Crawler rules
        │   ├── sitemap.ts              # XML sitemap
        │   ├── icon.tsx                # Dynamic 32x32 favicon
        │   ├── apple-icon.tsx          # Dynamic 180x180 touch icon
        │   ├── opengraph-image.tsx     # Default OG image (1200x630)
        │   ├── workshop/
        │   │   ├── layout.tsx          # Zone metadata
        │   │   ├── page.tsx            # Zone content
        │   │   └── opengraph-image.tsx  # Zone OG image
        │   ├── gallery/
        │   │   ├── layout.tsx
        │   │   ├── page.tsx
        │   │   └── opengraph-image.tsx
        │   ├── librarynth/
        │   │   ├── layout.tsx
        │   │   ├── page.tsx
        │   │   └── opengraph-image.tsx
        │   ├── contact/
        │   │   ├── layout.tsx
        │   │   ├── page.tsx
        │   │   └── opengraph-image.tsx
        │   ├── api/
        │   │   ├── session/route.ts
        │   │   ├── game-event/route.ts
        │   │   ├── rewards/route.ts
        │   │   ├── narrative/route.ts
        │   │   └── contact/route.ts
        │   └── admin/
        │       └── narrative/
        │           └── page.tsx        # Narrative CMS
        ├── components/
        │   ├── GodotEmbed.tsx          # Godot iframe wrapper
        │   ├── MiniGameTransition.tsx  # Transition overlay
        │   ├── TransitionContext.tsx   # Transition state provider
        │   ├── Navigation.tsx         # Site nav with transition hooks
        │   ├── ZoneHeader.tsx         # Zone entry banner
        │   ├── AmbientParticles.tsx   # CSS particle effects
        │   ├── PoAside.tsx            # Po speech bubble
        │   ├── PoStatus.tsx           # Po status display
        │   ├── PixelCard.tsx          # Card component
        │   ├── PixelButton.tsx        # Button component
        │   ├── PixelSectionHeader.tsx # Section header
        │   └── GameBoyControls.tsx    # Mobile touch controls
        ├── hooks/
        │   ├── useGodotBridge.ts      # PostMessage bridge
        │   ├── useGameEvents.ts       # Event subscription
        │   └── usePlayerState.ts      # Session + progress
        ├── lib/
        │   ├── godot-messages.ts      # Typed bridge protocol
        │   ├── game-events.ts         # Global event emitter
        │   ├── game-routes.ts         # Route → game mapping
        │   ├── zone-config.ts         # Zone theming registry
        │   ├── player-state.ts        # Session management
        │   ├── cookies.ts             # Cookie helpers
        │   ├── db.ts                  # PostgreSQL + auto-migration
        │   └── og-helpers.tsx         # OG image generator
        └── styles/
            └── globals.css            # Pixel-art design system
```

---

## The Concept

**Po** is a skeleton ghost with a fur-trimmed hooded jacket and a ghost tail. He has memory problems, a morphable body (Green Lantern flexibility, Deadpool personality), and is rooted in Indonesian "Po" mythology.

The website is not a website — it's a **game world**. Po navigates between zones (Workshop, Gallery, Librarynth, Contact) through mini-game transitions. First-time visitors play `po_runner` (an auto-runner with boss fights, artifact collection, genre morphing, and a full narrative arc). Returning visitors get NG+ mode (crimson Po, 7HP, new attacks).

**The Forbidden Six:** Six artifact pieces drop from boss encounters (70% chance per boss + pity system). Collecting all six unlocks the SIX25 discount code (25% off).

---

## Godot Bridge Protocol

The bridge is the nervous system connecting Next.js and Godot. It handles typed, validated messages in both directions.

### Files

| File | Purpose |
|------|---------|
| `web/src/lib/godot-messages.ts` | Type definitions for all commands and events |
| `web/src/hooks/useGodotBridge.ts` | React hook for sending/receiving messages |
| `web/src/lib/game-events.ts` | Global event emitter (pub/sub) |
| `web/src/hooks/useGameEvents.ts` | React hook for subscribing to game events |

### Host → Godot (Commands)

Commands are sent from Next.js to the Godot iframe via `postMessage`.

| Command | Data | Purpose |
|---------|------|---------|
| `start` | `{ level?, mode? }` | Start game (standard or ng_plus) |
| `move_to` | `{ target }` | Navigate Po to a zone |
| `config` | `{ relationshipLevel?, gamesPlayed?, ... }` | Push player state to game |
| `update_narrative` | `{ beats[] }` | Push dialogue overrides from CMS |
| `jump_press/release` | — | Virtual D-pad input |
| `slide_press/release` | — | Virtual D-pad input |
| `advance_press/release` | — | Dialogue advance (A button) |
| `attack1_press/release` | — | NG+ attack (C button) |
| `move_left_press/release` | — | Platformer movement |
| `move_right_press/release` | — | Platformer movement |

### Godot → Host (Events)

Events bubble up from the Godot iframe to Next.js via `postMessage`, validated by the `isGodotEvent()` type guard against a `VALID_EVENT_TYPES` set.

| Event | Data | Purpose |
|-------|------|---------|
| `game_ready` | — | Game loaded, ready for commands |
| `navigate` | `{ route }` | Po wants to go somewhere |
| `minigame_complete` | `{ score, skipped }` | Transition game finished |
| `player_state` | `{ mood, score, action }` | Real-time state sync |
| `game_error` | `{ message }` | Error reporting |
| `narrative_start` | `{ beatId }` | Dialogue sequence began |
| `narrative_end` | `{ beatId }` | Dialogue sequence finished |
| `onboarding_complete` | — | Player finished po_runner |
| `score_update` | `{ score, picks, distance }` | Live score feed |
| `game_over` | `{ score, distance }` | Run ended |
| `game_session` | `{ action, gameName, finalScore, duration }` | Session lifecycle |
| `piece_collected` | `{ piece, total }` | Artifact piece found |
| `morph_to_platformer` | — | Genre shift triggered |
| `morph_complete` | — | Genre shift finished |

### Security

- Origin validation: `window.location.origin` (same-origin iframes only)
- Event type guard: only events in `VALID_EVENT_TYPES` set pass through
- No sensitive data crosses the bridge

---

## Game Routing & Transitions

### Files

| File | Purpose |
|------|---------|
| `web/src/lib/game-routes.ts` | Route → game config mapping |
| `web/src/components/TransitionContext.tsx` | Transition state provider |
| `web/src/components/MiniGameTransition.tsx` | Full-screen game overlay |

### How It Works

1. User clicks a nav link (e.g., "Workshop")
2. `Navigation` calls `startTransition("/workshop")` via `TransitionContext`
3. `TransitionContext` looks up `/workshop` in `game-routes.ts`
4. If a game is configured, `MiniGameTransition` renders as a full-screen overlay
5. `GodotEmbed` loads the game iframe from `/games/{gameName}/index.html`
6. On `game_ready` event, the host sends `start` + `config` + `update_narrative` commands
7. Player plays (or presses ESC to skip)
8. On `minigame_complete` event, the transition overlay fades out and Next.js navigates to the target route

### Configuration

Games are configured via two sources (fallback chain):

1. **Runtime:** `/config/games.json` (fetched on app startup)
2. **Hardcoded:** `DEFAULT_CONFIG` in `game-routes.ts`

```typescript
// Route transitions
"/workshop"  → workshop_craft
"/gallery"   → gallery_run
"/librarynth" → librarynth_quest
"/contact"   → contact_dash

// Landing page
firstVisit   → po_runner (standard mode)
returning    → po_runner (ng_plus mode)
```

---

## Zone System

### Files

| File | Purpose |
|------|---------|
| `web/src/lib/zone-config.ts` | Single source of truth for zone theming |
| `web/src/components/ZoneHeader.tsx` | Zone entry banner component |
| `web/src/components/AmbientParticles.tsx` | CSS particle effects |
| `web/src/components/PoAside.tsx` | Po speech bubble with sprite |

### Zone Configuration

Each zone is defined in `zone-config.ts` with a full theming spec:

| Zone | Route | Accent Color | Glow | Particles | Section Color |
|------|-------|-------------|------|-----------|---------------|
| The Workshop | `/workshop` | `#ffbf00` (amber) | `crt-glow` | sawdust (falling) | amber |
| The Gallery | `/gallery` | `#8b5cf6` (purple) | `crt-glow-purple` | motes (rising) | purple |
| The Librarynth | `/librarynth` | `#4a90d9` (blue) | `crt-glow-blue` | sparkles (pulsing) | blue |
| Get In Touch | `/contact` | `#5ae05a` (green) | `crt-glow-green` | signals (expanding) | green |

Each zone also carries 4 randomized Po quotes displayed in the `ZoneHeader` via `PoAside`. Quote selection is stable per session (via `useMemo`).

### Zone Page Architecture

Zone pages are `"use client"` components (they use hooks and state). Since client components can't export `metadata` in Next.js App Router, each zone directory has a separate `layout.tsx` that:

1. Exports the `metadata` object (title, description, OG tags)
2. Passes `children` through unchanged: `return children;`

This pattern allows per-zone SEO while keeping page components client-side.

---

## Landing Page & Onboarding

**File:** `web/src/app/page.tsx`

The landing page is a multi-phase state machine:

```
Loading → Welcome → Controls → Playing → Done → (Reward) → Site
```

### Phases

1. **Loading** — "LOADING" text animation
2. **Welcome** — First visit: "WELCOME!" / Returning: "PO'S BACK!" (based on `shelley_onboarded` cookie)
3. **Controls** — GameBoy-style control diagram showing D-pad, A/B/C buttons
4. **Playing** — Full-screen `GodotEmbed` iframe + `GameBoyControls` overlay (mobile only)
5. **Done** — Brief fade-out (2 seconds)
6. **Reward Reveal** — If all 6 pieces collected during the run, displays the SIX25 discount card
7. **Site Content** — Standard page with links to all zones

### po_runner Game Flow

```
Auto-Runner → 6 Boss Encounters (RNG drops) → Morph to Platformer →
Tunnel (Librarynth) → Meet Captain Magus → Exit Portal → onboarding_complete
```

- **Boss drops:** 70% per boss + pity (guaranteed after 2 misses)
- **Rolling bosses:** After initial 6, bosses repeat every 300m
- **NG+ mode:** Crimson Po, 7HP, Spirit Fist + Ghost Whip attacks
- **Narrative:** 8 beats with multi-speaker MGS codec-style dialogue, press-to-reveal

### Mobile Controls

`GameBoyControls.tsx` renders a touch-friendly D-pad + action buttons:

| Control | Standard Mode | Narrative Mode | NG+ |
|---------|--------------|----------------|-----|
| D-pad Left/Right | Move (platformer only) | — | Move |
| D-pad Down | Slide | — | Slide |
| A Button | Jump | Advance dialogue | Jump + Advance |
| B Button | Slide | — | Slide |
| C Button | — | — | Attack |

---

## Player State & Session Management

### Files

| File | Purpose |
|------|---------|
| `web/src/lib/player-state.ts` | State store + API calls |
| `web/src/hooks/usePlayerState.ts` | React hook (useSyncExternalStore) |
| `web/src/lib/cookies.ts` | Cookie utilities |

### GameProgress Object

```typescript
interface GameProgress {
  gamesPlayed: number;
  gamesCompleted: number;
  gamesSkipped: number;
  totalScore: number;
  totalPicks: number;
  poRelationship: number;       // 0–100
  onboardingComplete: boolean;
  fourthWallUnlocked: boolean;
  piecesCollected: number;      // 0–6
  rewardCode: string | null;    // e.g., "SIX25"
  gameRecords: Record<string, GameRecord>;
}
```

### Flow

1. On app mount, `initSession()` calls `POST /api/session`
2. Server creates or retrieves session (UUID) + game_progress row
3. Progress cached in memory, exposed via `useSyncExternalStore`
4. Game events call `reportGameEvent()` → `POST /api/game-event`
5. Server updates DB, returns new progress
6. Client cache updated, React re-renders

### Key Cookie

`shelley_onboarded` — Set **only** on `onboarding_complete` game event (not on skip). Controls:
- Landing page welcome text (first visit vs. returning)
- Game mode selection (standard vs. ng_plus)

---

## Database Schema

**File:** `web/src/lib/db.ts`

Auto-migration runs on first query via `initSchema()`. No manual setup needed after deploys.

### Tables

```sql
-- Session tracking
sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ DEFAULT NOW()
)

-- Optional user accounts
accounts (
  id              SERIAL PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  display_name    TEXT,
  rewards_earned  TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Per-session game progress
game_progress (
  id                  SERIAL PRIMARY KEY,
  session_id          UUID REFERENCES sessions(id) ON DELETE CASCADE,
  account_id          INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  games_played        INTEGER DEFAULT 0,
  games_completed     INTEGER DEFAULT 0,
  games_skipped       INTEGER DEFAULT 0,
  total_score         INTEGER DEFAULT 0,
  total_picks         INTEGER DEFAULT 0,
  po_relationship     INTEGER DEFAULT 0,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  fourth_wall_unlocked BOOLEAN DEFAULT FALSE,
  pieces_collected    INTEGER DEFAULT 0,
  game_records        JSONB DEFAULT '{}',
  reward_code         TEXT DEFAULT NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
)

-- Dialogue overrides from CMS
narrative_overrides (
  id              SERIAL PRIMARY KEY,
  beat_id         TEXT UNIQUE NOT NULL,
  lines           JSONB NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      TEXT DEFAULT 'admin'
)
```

### Connection

PostgreSQL via `pg` driver. Connection string from `DATABASE_URL` env var (Railway injects automatically).

---

## API Routes

### `POST /api/session`

Creates or retrieves a session. Returns `{ sessionId, progress }`.

### `POST /api/game-event`

Accepts game events and updates `game_progress`. Supported events:
- `completed` — Increment `games_completed`
- `skipped` — Increment `games_skipped`
- `score_update` — Update `total_score`, `total_picks`
- `onboarding_complete` — Set `onboarding_complete = true`
- `piece_collected` — Increment `pieces_collected`, generate reward code at 6

### `GET /api/rewards`

Requires auth cookie. Returns reward tiers with earned status.

### `GET/POST/DELETE /api/narrative`

- **GET:** Returns all 8 beats with DB overrides merged. No auth (Godot calls this on `game_ready`).
- **POST:** Upsert beat override. Requires `ADMIN_SECRET` header.
- **DELETE:** Remove override (revert to default). Requires `ADMIN_SECRET`.

### `POST /api/contact`

Contact form submission. No auth required. 30-second cooldown.

---

## Rewards System

Five reward tiers based on player engagement:

| Tier | Trigger | Reward | Code |
|------|---------|--------|------|
| Explorer | Played 1 game | Badge | — |
| Dedicated | Completed 3 games | 10% discount | `PO10` |
| Forbidden Six | Collected 6 pieces | 25% discount | `SIX25` |
| Bonded | Po relationship >= 50 | 15% discount | `BONDED15` |
| Collector | 500+ picks collected | 20% discount | `PICKS20` |

### Piece Collection

- Boss encounters drop pieces at 70% rate
- Pity system: guaranteed drop after 2 consecutive misses
- `piece_collected` events tracked server-side in `game_progress.pieces_collected`
- At 6 pieces, `reward_code = "SIX25"` generated automatically
- Pixel-art reward reveal card shown after `onboarding_complete`

---

## Narrative CMS

### Architecture

Default narrative beats are embedded in the Godot export. The CMS allows runtime overrides without re-exporting the game.

```
┌─────────────┐     POST /api/narrative     ┌──────────────────┐
│ Admin UI    │ ─────────────────────────── │ narrative_overrides│
│ /admin/     │                             │ (PostgreSQL)      │
│ narrative   │                             └────────┬─────────┘
└─────────────┘                                      │
                                                     │ GET /api/narrative
                                              ┌──────▼──────┐
                                              │ Merged beats │
                                              │ (defaults +  │
                                              │  overrides)  │
                                              └──────┬──────┘
                                                     │ update_narrative command
                                              ┌──────▼──────┐
                                              │ Godot       │
                                              │ (po_runner)  │
                                              └─────────────┘
```

### Beat Format

```typescript
interface NarrativeBeat {
  id: string;                                           // e.g., "intro_run"
  trigger_type: "distance" | "piece_collected"
              | "post_morph_timer" | "area_entered";
  lines: Array<string | { speaker: string; text: string }>;
  signal?: "morph_to_platformer" | "onboarding_complete";
}
```

Lines can be plain strings (Po speaking) or `{ speaker, text }` objects for multi-speaker dialogue (MGS codec style).

### Admin UI

Located at `/admin/narrative`. Authenticates with `ADMIN_SECRET` env var. Features:
- View all 8 beats with current lines
- JSON editor for line arrays
- Preview with speaker color coding
- Save to DB or revert to defaults
- Changes take effect on next game load

---

## Design System

### Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Amber | `#ffbf00` | Primary accent, Workshop zone |
| Charcoal | `#1a1a1a` | Background |
| Wood | `#4a3728` | Secondary, warm accents |
| Dark Wood | `#2d1f15` | Deep backgrounds |
| Spirit Blue | `#4a90d9` | Librarynth zone |
| Spirit Green | `#5ae05a` | Contact zone |
| Djinn Purple | `#8b5cf6` | Gallery zone |
| HP Red | `#e05a5a` | Health indicator |

### Font

**Press Start 2P** — Pixel-art font loaded from `/public/fonts/press-start-2p.woff2`. Mapped to Tailwind's `font-pixel` class via CSS variable `--font-pixel`.

### Core CSS Classes

#### Panels
- `.pixel-panel` — Primary container (2px amber border, #1a1a1a bg, inset shadow)
- `.pixel-panel-raised` — Elevated variant (4px drop shadow, wood tint)
- `.pixel-panel-inset` — Recessed variant (darker bg, inset shadow)

#### Buttons
- `.pixel-btn` — Primary (amber bg, 4px drop shadow, 2px active press)
- `.pixel-btn-ghost` — Transparent with amber border on hover
- `.pixel-btn-green` — Green variant for Contact zone

#### Effects
- `.crt-glow` — Amber text shadow (0 0 10px)
- `.crt-glow-blue` — Blue text shadow
- `.crt-glow-purple` — Purple text shadow
- `.crt-glow-green` — Green text shadow
- `.scanlines` — CRT scanline overlay via pseudo-element
- `.pixel-divider` — Dashed amber line

#### Ambient
- `body::before` — Radial vignette gradient
- `body::after` — Ultra-subtle scanlines (1px repeating)

### Particle Animations

Four zone-specific particle effects, all CSS-only with `will-change: transform, opacity` for GPU compositing:

| Type | Zone | Motion | Color |
|------|------|--------|-------|
| `sawdust` | Workshop | Falling + gentle drift | Amber |
| `motes` | Gallery | Rising + floating | Purple |
| `sparkles` | Librarynth | Scale pulsing | Blue |
| `signals` | Contact | Expanding rings | Green |

### Sprite System

Po's idle animation uses a 4-frame sprite sheet (`idle_sheet.png`) animated with CSS `steps(4)`:

```css
.sprite-anim {
  width: 48px; height: 48px;
  background-size: 400% 100%;
  image-rendering: pixelated;
}
.animate-sprite-idle {
  animation: sprite-idle 1.6s steps(4) infinite;
}
```

### Tailwind Extensions

```typescript
// tailwind.config.ts
boxShadow: {
  'pixel':       '4px 4px 0px rgba(0,0,0,0.8)',
  'pixel-sm':    '2px 2px 0px rgba(0,0,0,0.8)',
  'pixel-amber': '4px 4px 0px rgba(255,191,0,0.3)',
  'pixel-inset': 'inset 2px 2px 0px rgba(0,0,0,0.4)',
}

animation: {
  'sprite-idle':  'sprite-idle 1.6s steps(4) infinite',
  'blink-cursor': 'blink-cursor 1s steps(1) infinite',
  'float':        'float 3s ease-in-out infinite',
  'badge-pulse':  'badge-pulse 2s ease-in-out infinite',
}
```

---

## SEO & Metadata

### Root Metadata (`layout.tsx`)

```typescript
metadataBase: new URL("https://www.shelleyguitar.com")
title: {
  default: "Shelley Guitar | Handcrafted Instruments & Creative Universe",
  template: "%s | Shelley Guitar"
}
```

Child pages set just their title (e.g., `"The Workshop"`) and the template auto-appends `| Shelley Guitar`.

### Per-Zone SEO

Each zone directory has a `layout.tsx` that exports metadata:

| Zone | Title | OG Image Color |
|------|-------|---------------|
| Workshop | "The Workshop" | Amber stripe |
| Gallery | "The Gallery" | Purple stripe |
| Librarynth | "The Librarynth" | Blue stripe |
| Contact | "Get In Touch" | Green stripe |

### Open Graph Images

Generated at build time using `next/og` `ImageResponse` (1200x630 PNG). Shared helper in `og-helpers.tsx`:

- Dark background (#1a1a1a)
- Zone name in large text
- Zone tagline
- Accent color bars (top and bottom)
- "SHELLEY GUITAR" brand text

### Favicon & Icons

- `icon.tsx` — 32x32 dynamic favicon (amber "S" on dark background)
- `apple-icon.tsx` — 180x180 apple touch icon (same design, larger, rounded corners)

### robots.txt

```
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /testing
Disallow: /testinggame01
Sitemap: https://www.shelleyguitar.com/sitemap.xml
```

### sitemap.xml

| URL | Priority | Change Frequency |
|-----|----------|-----------------|
| `/` | 1.0 | weekly |
| `/workshop` | 0.8 | weekly |
| `/gallery` | 0.8 | weekly |
| `/librarynth` | 0.7 | monthly |
| `/contact` | 0.6 | monthly |

### JSON-LD

Organization schema embedded in root layout `<body>`:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Shelley Guitar",
  "url": "https://www.shelleyguitar.com",
  "description": "Boutique handcrafted guitars...",
  "sameAs": ["https://www.instagram.com/shelleyguitar"]
}
```

---

## Deployment

### Railway Configuration

```toml
# railway.toml (repo root)
[build]
buildCommand = "cd web && npm install && npm run build"

[deploy]
startCommand = "cd web && npx next start -p ${PORT:-8080}"
healthcheckPath = "/"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### Deploy Flow

1. Push to `master` branch on GitHub
2. Railway detects push, runs build command
3. `npm run build` compiles Next.js (includes OG image generation, sitemap, robots)
4. Server starts on `PORT=8080` (Railway-assigned)
5. Health check hits `/` to confirm deployment success

### Services

- **Web:** Next.js application (auto-deploy)
- **Database:** Railway-managed PostgreSQL (auto-provisioned, `DATABASE_URL` injected)

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Railway injects) |
| `JWT_SECRET` | Production | JWT token signing key |
| `ADMIN_SECRET` | Yes | Narrative CMS authentication |
| `NODE_ENV` | Auto | "production" (Railway sets) |
| `PORT` | Auto | Server port (Railway sets to 8080) |

---

## Critical Gotchas

### 1. COOP/COEP Headers

Godot exports are built as single-threaded GL Compatibility (no SharedArrayBuffer needed). Do **not** set `Cross-Origin-Opener-Policy` or `Cross-Origin-Embedder-Policy` headers — they'll break iframe communication.

If headers appear in a Godot re-export, set `ensureCrossOriginIsolationHeaders` to `false` in the exported `index.html`.

### 2. Godot Scene Syntax

**Never** use inline `instance="res://path.tscn"` in .tscn files. Use `instance=ExtResource("id")` with a proper `ext_resource` declaration. Inline syntax silently fails in web builds.

### 3. Onboarding Cookie vs. Skip

The `shelley_onboarded` cookie is set **only** on `onboarding_complete` game event. Skipping the game does **not** set the cookie. This means:
- Skip = session-only (game replays on next visit)
- Complete = permanent (NG+ on return)

### 4. Obstacle Push-Back

In Godot, `CharacterBody2D`'s `move_and_slide()` can push Po via `StaticBody2D` obstacles. Fix: lock `position.x = 100` after `move_and_slide()` in the runner segment.

### 5. Client Components & Metadata

Next.js App Router client components (`"use client"`) cannot export `metadata`. The workaround: per-zone `layout.tsx` files that export metadata and pass children through.

### 6. Auto-Migration

`db.ts` runs `initSchema()` lazily on first query. No manual `/api/setup` endpoint needed after deploys. Schema changes require updating the `initSchema()` function.

### 7. Game Export Location

Godot HTML5 exports must be placed in `web/public/games/{gameName}/` with an `index.html` entry point. The game name in the directory must match the `gameName` in `game-routes.ts`.

---

## Team

| Handle | Role |
|--------|------|
| **XZA (Magus)** | Lead, dialogue/story, creative direction |
| **Rizky** | Head graphics, Godot game builds |
| **Gemini** | Local repo tasks, detailed page builds |
| **CZA (Cipher)** | Architecture, bridge systems, integration |

---

*Last updated: February 28, 2026*
