# Po Encounter System — Master Architecture

> **Overseer:** CZA (Cipher)
> **Status:** Implementation Blueprint
> **Dependencies:** Each task is numbered. Dependencies are listed per task.

---

## System Overview

The Po Encounter System replaces the static "Talk to Po" sidebar button with **organic, ambient triggers** that make Po feel alive. When triggered, any encounter opens the **Codec V2** — a redesigned dialogue overlay inspired by Metal Gear Solid's codec, but distinctly Shelley.

```
┌─────────────────────────────────────────────────────────────────┐
│                      PO ENCOUNTER ENGINE                        │
│                  (usePoEncounter hook — T3)                      │
│                                                                 │
│  Idle Timer ─┐                                                  │
│  Scroll Mile ┤    ┌──────────────┐    ┌─────────────────────┐  │
│  Hover Dwell ┼──▶ │ Trigger      │──▶ │ Active Encounter    │  │
│  Zone Enter  ┤    │ Scheduler    │    │ (paper plane, knock, │  │
│  Random      ┘    │ (cooldowns,  │    │  ring, pigeon, etc.) │  │
│                   │  priorities) │    └──────────┬──────────┘  │
│                   └──────────────┘               │              │
│                                                  ▼              │
│                                         ┌───────────────┐      │
│                                         │  CODEC V2     │      │
│                                         │  (if accepted)│      │
│                                         └───────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## TASK 1: Codec V2 — The Redesigned Dialogue System

**Priority:** FIRST (everything feeds into this)
**Dependencies:** None
**Files to modify:** `CodecOverlay.tsx`, `globals.css`
**Files to create:** `CrystalBonsai.tsx`, `PoDossier.tsx`

### Layout (Three-Panel, MGS-Inspired)

```
┌──────────────────────────────────────────────────────────────────────┐
│  CODEC ─────────────────────────────────────────────────── [✕]      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────┐     ┌──────────────┐     ┌────────────────────┐     │
│  │            │     │              │     │  ╔══════════════╗  │     │
│  │     PO     │     │   CRYSTAL    │     │  ║  DOSSIER     ║  │     │
│  │  (upper    │     │   BONSAI     │     │  ║              ║  │     │
│  │   body,    │     │   ARTIFACT   │     │  ║  [pentagon]  ║  │     │
│  │   large,   │     │              │     │  ║              ║  │     │
│  │   green    │     │  ⚛ 🌳 ⚛     │     │  ║  Stats/Info  ║  │     │
│  │   CRT      │     │              │     │  ║              ║  │     │
│  │   tint)    │     │  (energy     │     │  ╚══════════════╝  │     │
│  │            │     │   waves)     │     │                    │     │
│  └────────────┘     └──────────────┘     └────────────────────┘     │
│   PO                                      ZONE INTEL                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ PO: "You've been staring at that guitar for a while..."     │   │
│  │                                                  [▶ NEXT]   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                          1/3        │
└──────────────────────────────────────────────────────────────────────┘
```

### Left Panel — Po Portrait
- **Size:** ~200px wide, ~250px tall
- **Content:** Upper body shot of Po (hood, jacket, skull face, ghost tail hint)
- **Effect:** Green CRT tint via CSS `filter: sepia(1) hue-rotate(70deg) saturate(1.5) brightness(0.8)`
- **Overlay:** CSS scanlines (existing pattern, tightened)
- **Subtle animation:** Slight breathing scale (0.98 → 1.02, 3s ease)
- **Label:** "PO" below portrait in amber pixel font

### Center Panel — Crystal Bonsai Artifact
- **Pure CSS/SVG component** — NOT an image
- **Concept:** A crystalline bonsai tree with atomic orbital rings
- **Structure:**
  - Trunk: jagged crystal segments (CSS clip-path or SVG path), pale cyan/white
  - Branches: 3-4 angular crystal limbs with glowing tips
  - Atomic rings: 2-3 elliptical orbit paths (SVG) rotating at different speeds
  - Energy particles: small dots traveling along orbital paths
  - Base glow: radial gradient emanating from trunk base
  - Ambient pulse: entire artifact breathes with subtle opacity/scale shift
- **Color palette:** Cyan (#00fff2), pale white, hints of amber at branch tips
- **Size:** ~120px wide, scales with viewport
- **Animation:** Orbits rotate (8s, 12s, 16s), particles travel paths, trunk has subtle crystal shimmer

### Right Panel — Dossier / Info Panel
- **Concept:** Pokemon Red/Blue stat pentagon + JoJo Stand stats
- **Layout:**
  - Header: "ZONE INTEL" or zone name
  - Pentagon/hexagon SVG chart with 5 axes:
    - CRAFT (workshop builds)
    - LORE (librarynth knowledge)
    - SIGNAL (contact/communication)
    - SPIRIT (game progress/pieces)
    - STYLE (gallery/aesthetics)
  - Below chart: 2-3 stat lines (e.g., "Pieces: 3/6", "Zone: Workshop", "Visits: 7")
- **Note:** Data for the pentagon is PLACEHOLDER for now. We'll build the stat tracking system later. For now, hardcode sample values or derive from existing cookies.
- **Visual style:** Sharp borders, pixel font, monochrome green with amber accents

### Bottom Panel — Dialogue (existing, refined)
- Typewriter text, speaker label, advance button
- Same logic as current `CodecOverlay.tsx`
- Line counter in bottom-left

### CSS Effects
- Green CRT colorize on both portrait panels
- Scanlines across entire codec window
- `codec-window-enter` / `codec-window-exit` animations (keep existing stepped approach)
- Amber border, dark bg (existing)
- New: subtle screen flicker on open (CSS animation, 2 frames, 150ms)

### Responsive
- **Desktop:** Three-panel horizontal layout as shown
- **Tablet:** Stack crystal bonsai above the portrait+dossier row
- **Mobile:** Po portrait + dialogue only. Bonsai hidden. Dossier accessible via tab/swipe.

### Prompt for Implementation Session

```
TASK: Redesign CodecOverlay.tsx to Codec V2 — three-panel MGS-inspired layout.

CURRENT STATE:
- CodecOverlay.tsx exists at web/src/components/CodecOverlay.tsx
- Uses useCodecOverlay hook (context: isOpen, costume, zoneId, openCodec, closeCodec)
- Has typewriter effect, focus trap, ESC close, backdrop click close
- Styled with codec-window class, amber border, dark bg, scanlines

CHANGES NEEDED:

1. Layout: Replace single portrait+dialogue with three-panel horizontal layout:
   - LEFT: Po portrait (200x250px area), green CRT tint, scanlines, breathing animation
   - CENTER: Crystal Bonsai artifact component (pure CSS/SVG, see below)
   - RIGHT: Dossier panel with zone stats pentagon (SVG, see below)
   - BOTTOM: Dialogue text area (keep existing typewriter logic)

2. Create CrystalBonsai.tsx component:
   - Pure CSS/SVG — crystal tree trunk, angular branches, glowing tips
   - 2-3 atomic orbital rings (SVG ellipses) rotating at different speeds (8s, 12s, 16s)
   - Small energy particles traveling along orbits
   - Base radial glow, cyan/white palette with amber accents at tips
   - Subtle breathing pulse on the whole artifact
   - prefers-reduced-motion: pause all animations

3. Create PoDossier.tsx component:
   - Props: zoneId, stats (placeholder for now)
   - SVG pentagon chart with 5 axes: CRAFT, LORE, SIGNAL, SPIRIT, STYLE
   - Filled polygon showing current values (hardcode sample: [0.7, 0.4, 0.6, 0.3, 0.8])
   - Labels at each vertex in pixel font
   - Below chart: 2-3 info lines (zone name, visit count, pieces collected)
   - Green monochrome with amber accents

4. Po Portrait:
   - Use PoZoneAnimation but at larger size (~200px)
   - Wrap in a container with CSS filter for green CRT tint:
     filter: sepia(1) hue-rotate(70deg) saturate(1.5) brightness(0.8)
   - Overlay tighter scanlines
   - Add subtle breathing scale animation (0.98→1.02, 3s ease)
   - "PO" label below

5. Responsive:
   - Desktop (>768px): Three panels side by side, dialogue below
   - Mobile (<=768px): Po portrait + dialogue only. Hide bonsai + dossier.

6. Keep ALL existing functionality:
   - Typewriter effect, line advancement, skip
   - Focus trap, ESC close, backdrop click
   - codec-window-enter/exit animations
   - Speaker label, line counter

DESIGN REFERENCE: Metal Gear Solid codec — two large portrait panels flanking a
center device, dialogue text below. But ours is Shelley-flavored: crystal bonsai
instead of radio, stat dossier instead of second portrait.

IMPORTANT: The Crystal Bonsai and Dossier pentagon are visual-only for now.
Stat values are hardcoded placeholders. The real data pipeline comes later.
```

---

## TASK 2: Po Upper Body Portrait Asset

**Priority:** Can run in parallel with T1 (T1 uses existing sprite as placeholder)
**Dependencies:** None (PixelLab generation)
**Deliverable:** Static PNG, upper body Po, ~256x320px

### What to Generate
- Po from chest up: skull face, hollow eye sockets (with faint cyan glow), hooded jacket with fur trim
- Slightly angled (3/4 view facing right — towards the center of the codec)
- Neutral/attentive expression (as much as a skull can express)
- Transparent background
- Pixel art style matching existing Po assets (48px character scaled up)
- Higher detail than game sprites — this is a portrait

### Prompt for Art Session

```
TASK: Generate a Po upper-body portrait for the Codec V2 overlay.

Use PixelLab create_character or generate with these specs:
- Character: Po — skeleton ghost with fur-trimmed hooded jacket, skull face, hollow eye sockets
- View: Upper body (chest up), 3/4 angle facing slightly right
- Size: 128x128 canvas (will display at 200-250px via CSS scaling)
- Style: "high detail", "single color black outline", "detailed shading"
- Proportions: Default or stylized
- Description: "skeleton ghost character, skull face with hollow glowing eye sockets,
  wearing a hooded jacket with fur trim around the hood, ghostly ethereal,
  pixel art character portrait, upper body view"

Existing Po character ID for reference: b14fef2f-719b-4586-a714-fa8ba77f7c91

After generation:
1. Download the south-facing rotation image
2. Save to web/public/sprites/po/codec_portrait.png
3. Update PO_COSTUMES.default in zone-config.ts to add portrait path
```

---

## TASK 3: Po Encounter Engine — Core Hook

**Priority:** SECOND (after T1, before triggers)
**Dependencies:** T1 (Codec V2 must exist to open)
**Files to create:** `usePoEncounter.ts`, `PoEncounterProvider.tsx`
**Files to modify:** `Sidebar.tsx` (integrate), root layout (add provider)

### Architecture

The engine is a React context + hook that:
1. Monitors user behavior (idle time, scroll position, hover dwell, zone changes)
2. Selects an appropriate trigger based on cooldowns, zone context, and randomness
3. Dispatches the chosen encounter (paper plane, knock, ring, etc.)
4. Tracks encounter history to avoid repetition and annoyance

### State Shape

```ts
interface PoEncounterState {
  // Trigger conditions
  idleMs: number;              // ms since last interaction
  scrollDepth: number;         // 0-1 how far down the page
  hoverTarget: string | null;  // CSS selector of hovered element
  hoverDwellMs: number;        // ms hovering same element
  zoneId: ZoneId | null;

  // Encounter state
  activeEncounter: EncounterType | null;  // which encounter is playing
  encounterPhase: 'idle' | 'entering' | 'waiting' | 'accepted' | 'dismissed' | 'exiting';

  // History / cooldowns
  lastEncounterTime: number;   // timestamp of last encounter
  encounterCount: number;      // total encounters this session
  dismissCount: number;        // times user said no / ignored
  cooldownMs: number;          // current cooldown (increases with dismissals)
}

type EncounterType =
  | 'paper_plane'
  | 'knock'
  | 'codec_ring'
  | 'cursor_stalk'
  | 'zone_drop';    // pigeon / guitar pick / paint splat / book page
```

### Cooldown Logic
- **Base cooldown:** 60s after any encounter
- **After dismiss:** cooldown doubles (60 → 120 → 240s, cap at 300s)
- **After accept:** cooldown resets to base
- **Session cap:** Max 5 unsolicited encounters per session
- **Never trigger during:** game transitions, codec already open, first 10s on page

### Trigger Priority
1. Zone enter (first visit) → Codec Ring
2. Idle > 12s → Paper Plane (60%) or Knock (40%)
3. Hover dwell > 4s on interactive element → Knock
4. Scroll > 80% of page → Zone Drop
5. Random timer (90-180s) → Cursor Stalk (ambient, doesn't force codec)

### Prompt for Implementation Session

```
TASK: Build the Po Encounter Engine — usePoEncounter hook + provider.

This is the ORCHESTRATOR that decides WHEN and WHICH trigger fires.
It does NOT render any UI itself. It exposes state that trigger components read.

Create:
1. web/src/hooks/usePoEncounter.ts — the encounter state machine
2. web/src/components/PoEncounterProvider.tsx — context provider

The hook should:
- Track idle time (reset on mousemove, scroll, click, keydown)
- Track scroll depth (0-1 ratio)
- Track hover dwell (how long cursor stays on same element)
- Know current zoneId (from ZoneSidebarContext)
- Manage cooldowns (base 60s, doubles on dismiss, caps at 300s, resets on accept)
- Cap at 5 unsolicited encounters per session
- Never trigger during: game transitions (check TransitionContext.isActive),
  codec already open (check useCodecOverlay.isOpen), first 10s on page
- Select trigger type based on priority rules:
  1. Zone first-enter → 'codec_ring'
  2. Idle > 12s → 'paper_plane' (60%) or 'knock' (40%)
  3. Hover dwell > 4s on interactive → 'knock'
  4. Scroll > 80% → 'zone_drop'
  5. Random timer 90-180s → 'cursor_stalk'

Expose:
- activeEncounter: EncounterType | null
- encounterPhase: 'idle' | 'entering' | 'waiting' | 'accepted' | 'dismissed' | 'exiting'
- acceptEncounter(): void — user said yes → open codec
- dismissEncounter(): void — user ignored/declined
- clearEncounter(): void — encounter finished its animation

The provider wraps around the app (add to root layout alongside CodecProvider).
When activeEncounter changes, the corresponding trigger component (Task 4-8)
handles its own rendering/animation.

EXISTING CONTEXTS TO READ FROM:
- useCodecOverlay() — isOpen, openCodec()
- useZoneSidebar() — current zone
- useTransition() — isActive (game loading)

DO NOT render any trigger UI in this hook. That's handled by individual
trigger components that consume this context.
```

---

## TASK 4: Paper Plane Trigger

**Priority:** THIRD (most charming trigger)
**Dependencies:** T3 (encounter engine)
**Files to create:** `PaperPlaneEncounter.tsx`

### Behavior
1. Engine sets `activeEncounter = 'paper_plane'`
2. A pixel-art paper plane appears at the sidebar edge
3. Flies across the content area in a tumbling arc (CSS keyframe trajectory)
4. Lands somewhere in the visible viewport (random but within content bounds)
5. Sits there for 8 seconds. Hover → plane unfolds slightly (scale/rotate hint)
6. Click → plane opens flat revealing handwritten note:
   ```
   ┌─────────────────────┐
   │  do you want to     │
   │  talk to me?        │
   │                     │
   │  [✓] yes  [ ] no    │
   └─────────────────────┘
   ```
7. Click YES → codec opens. Click NO → plane refolds, flies back to sidebar
8. If ignored (8s timeout) → plane gently drifts off-screen to the right

### Visual Details
- Plane: CSS-only (two triangles, paper-white with faint fold lines)
- Flight path: cubic-bezier arc, slight rotation wobble
- Landing: small bounce on "impact" (transform scale pulse)
- Note: torn paper texture (CSS), handwritten-style pixel font, checkbox squares
- Return flight: smoother, faster arc back to sidebar

### Prompt for Implementation Session

```
TASK: Build the Paper Plane encounter trigger component.

Create web/src/components/encounters/PaperPlaneEncounter.tsx

This component reads from PoEncounterProvider context:
- Only renders when activeEncounter === 'paper_plane'
- Uses encounterPhase to drive animation states

PHASES:
1. 'entering': Paper plane CSS element appears at left sidebar edge (x: 200px, y: random 30-60vh).
   Animates along a tumbling arc trajectory to a landing position (x: random 40-70vw, y: random 30-70vh).
   CSS keyframe animation ~1.5s with rotation wobble.
   On animation end → set encounterPhase to 'waiting'

2. 'waiting': Plane sits at landing position for up to 8s.
   - On hover: plane tilts up slightly (transform hint it's interactive)
   - On click: transition to note reveal
   - After 8s timeout: auto-dismiss, plane drifts off-screen right

3. Note reveal (sub-state within 'waiting'):
   - Plane unfolds animation (scale + rotate to flat)
   - Reveals a note overlay positioned at the plane's location
   - Note content: "do you want to talk to me?" with two checkbox-style buttons
   - YES → call acceptEncounter() which opens codec
   - NO → call dismissEncounter(), play refold + return flight animation

4. 'exiting': Plane flies back to sidebar or drifts off-screen. On animation end → clearEncounter()

VISUAL SPEC:
- Paper plane: Pure CSS (two triangle shapes using borders or clip-path, white/off-white)
- Fold line: 1px subtle gray line down the center
- Shadow: tiny drop shadow during flight
- Note: torn-paper look (ragged edges via clip-path or pseudo-elements)
- Font: font-pixel, handwritten feel at small size
- Checkboxes: pixel-art square boxes, amber check mark on hover/select
- The plane should have a z-index above page content but below the codec overlay

IMPORTANT:
- prefers-reduced-motion: skip flight animation, just appear at landing spot
- Mobile: don't render this trigger (too small a viewport for the flight path)
- The note interaction must be keyboard accessible (tab to yes/no, enter to select)
```

---

## TASK 5: The Knock Trigger

**Priority:** THIRD (parallel with T4)
**Dependencies:** T3 (encounter engine)
**Files to create:** `KnockEncounter.tsx`

### Behavior
1. Engine sets `activeEncounter = 'knock'`
2. Sidebar border gets a "knock" ripple effect — like someone tapping glass from the other side
3. Two knocks, 400ms apart (CSS animation on sidebar border)
4. After second knock, a tiny speech bubble appears from Po's sidebar sprite: "psst."
5. Bubble stays for 5s. Click it → codec opens. Ignore → fades away.

### Visual Details
- Knock effect: sidebar right border flashes brighter (amber pulse), small circular ripple expanding from a point on the border
- Speech bubble: classic pixel-art bubble (rectangular with triangle pointer toward sidebar)
- "psst." in pixel font, tiny, white text on dark bg
- Bubble appears just to the right of the sidebar, at Po's vertical position

### Prompt for Implementation Session

```
TASK: Build the Knock encounter trigger component.

Create web/src/components/encounters/KnockEncounter.tsx

This component reads from PoEncounterProvider context:
- Only renders when activeEncounter === 'knock'

PHASES:
1. 'entering': Two "knock" effects on the sidebar's right edge.
   - Each knock: sidebar border-right flashes to full amber opacity for 100ms,
     plus a small circular ripple (expanding ring) at a point ~60% down the sidebar.
   - Knock 1 at 0ms, Knock 2 at 400ms.
   - After 800ms → 'waiting'

2. 'waiting': Speech bubble appears next to the sidebar.
   - Position: just outside the sidebar's right edge, vertically aligned with
     the Po animation sprite in the sidebar zone section.
   - Content: "psst." in font-pixel, tiny (text-[7px])
   - Pixel-art bubble: dark bg (#1a1a1a), 1px amber border, triangle pointer toward sidebar
   - Entrance: steps(3) animation, 200ms (pop in pixel-style)
   - Stays for 5s
   - On click → acceptEncounter() → codec opens
   - On timeout → dismissEncounter()

3. 'exiting': Bubble fades out (opacity 0 over 300ms) → clearEncounter()

KNOCK RIPPLE EFFECT:
- CSS: A pseudo-element on the sidebar or an absolutely positioned div
- Circular ring that expands from 0 to 30px diameter, opacity 1→0
- Color: shelley-amber
- Duration: 400ms per ripple
- Two ripples, staggered

IMPORTANT:
- The knock effect modifies the SIDEBAR's appearance temporarily.
  Use a CSS class toggled via context, or render an overlay positioned
  relative to the sidebar.
- prefers-reduced-motion: skip ripple, just show bubble directly
- Mobile: position bubble above the bottom nav bar instead
- Keyboard: bubble should be focusable, Enter to accept
```

---

## TASK 6: Codec Ring Trigger

**Priority:** THIRD (parallel with T4, T5)
**Dependencies:** T3 (encounter engine)
**Files to create:** `CodecRingEncounter.tsx`

### Behavior
1. Engine sets `activeEncounter = 'codec_ring'`
2. A small crystal bonsai artifact (mini version of the codec's center piece) materializes in the bottom-right corner of the viewport
3. It pulses/vibrates — energy waves ripple outward (like a phone ringing)
4. Rings 3 times (each ring = 2s pulse cycle). If not clicked → slides away.
5. Click → full codec opens with crystal bonsai already "connected"

### Visual Details
- Mini crystal bonsai: ~60px version of the CrystalBonsai component from T1
- Ring pulse: expanding concentric circles of cyan energy
- Each ring cycle: bonsai shakes slightly (2px translate jitter) + energy wave
- After 3 rings: bonsai shrinks and slides off bottom-right

### Prompt for Implementation Session

```
TASK: Build the Codec Ring encounter trigger component.

Create web/src/components/encounters/CodecRingEncounter.tsx

This uses a MINI version of the CrystalBonsai from Task 1.
If CrystalBonsai.tsx exists, import and render at small size.
If not yet built, create a simplified version (just the trunk + one orbit ring).

PHASES:
1. 'entering': Mini crystal bonsai materializes in bottom-right viewport corner.
   - Position: fixed, bottom 24px, right 24px
   - Size: ~60x60px container
   - Entrance: scale 0→1, 300ms, stepped (pixel feel)

2. 'waiting': Three ring cycles, 2s each (total 6s).
   Each cycle:
   - Bonsai jitters (random 1-2px translate, 100ms intervals)
   - Energy wave: concentric circle expanding from bonsai center,
     cyan color, opacity 1→0, 40px radius, 600ms
   - Subtle screen-edge glow (bottom-right corner gets faint cyan radial gradient)

   After 3 cycles without click → auto-dismiss
   On click → acceptEncounter() → codec opens

3. 'exiting': Bonsai shrinks (scale 1→0) and slides down-right → clearEncounter()

VISUAL SPEC:
- Mini bonsai: simplified crystal shape (CSS clip-path tree shape, cyan fill)
  with one orbital ring (SVG ellipse, rotating)
- Energy waves: CSS animation, expanding border-radius circle with opacity fade
- Corner glow: pseudo-element with radial-gradient(circle at bottom right, cyan/10 0%, transparent 60%)
- z-index: above content, below codec overlay

IMPORTANT:
- prefers-reduced-motion: static bonsai with gentle opacity pulse instead of jitter/waves
- Mobile: position bottom-center above the nav bar
- Keyboard: focusable, Enter to accept
- This is the trigger for FIRST ZONE VISIT — should feel like "incoming transmission"
```

---

## TASK 7: Cursor Stalk Trigger (Ambient)

**Priority:** FOURTH (flavor, not critical path)
**Dependencies:** T3 (encounter engine), sidebar Po sprite reference
**Files to create:** `CursorStalkEncounter.tsx`

### Behavior — Unique: This One Doesn't Force a Codec
1. Engine sets `activeEncounter = 'cursor_stalk'`
2. Po's eyes in the sidebar sprite subtly track the cursor position
3. If user moves cursor over Po directly, a speech bubble: "...you can see me?"
4. Click the bubble → codec opens
5. If user doesn't hover Po within 15s → eyes return to normal, encounter ends silently

### Implementation Note
This is trickier because it modifies the existing sidebar Po sprite behavior.
Options:
- (A) Overlay two "eye dot" divs on top of the Po sprite, positioned dynamically
- (B) Swap the sprite sheet to a "tracking" variant (would need art)
- (C) Use CSS transform on tiny pseudo-elements positioned at eye socket locations

Option A is most practical. Two small cyan dots (3x3px) positioned absolutely over the sprite, with transform based on cursor angle.

### Prompt for Implementation Session

```
TASK: Build the Cursor Stalk ambient encounter.

Create web/src/components/encounters/CursorStalkEncounter.tsx

This is an AMBIENT trigger — it doesn't interrupt the user, just adds flavor.

BEHAVIOR:
1. When activeEncounter === 'cursor_stalk', the component activates.
2. Track mouse position globally (mousemove listener).
3. Render two small "eye" dots (3x3px, cyan glow) positioned over the Po sprite
   in the sidebar. These dots track toward the cursor position.
   - Calculate angle from Po's eye sockets to cursor
   - Move dots max 3px in that direction (subtle, not cartoonish)
   - Eye socket positions: approximately 40% and 60% horizontal,
     35% vertical within the Po sprite container. Fine-tune visually.

4. If cursor enters the Po sprite area (hover):
   - Speech bubble appears: "...you can see me?"
   - Bubble same style as KnockEncounter bubble
   - Click → acceptEncounter() → codec
   - If cursor leaves → bubble hides after 2s

5. If 15s pass without hover on Po → clearEncounter() silently.
   Eyes return to hidden (fade out).

VISUAL:
- Eye dots: 3x3px, background cyan (#00fff2), box-shadow for glow effect
- Position: absolute within the PoZoneAnimation container in sidebar
- Movement: smooth (transition: transform 0.1s), max 3px offset from center
- Speech bubble: same component/style as KnockEncounter's bubble

IMPORTANT:
- prefers-reduced-motion: skip eye tracking, just show bubble on hover
- Mobile: skip entirely (no cursor to track)
- This should feel SUBTLE. If the user isn't looking at the sidebar, they
  might not even notice. That's fine. It's ambient flavor.
- Only show eye dots when a zone is active (sidebar has Po sprite visible)
```

---

## TASK 8: Zone Drop Trigger

**Priority:** FOURTH (parallel with T7)
**Dependencies:** T3 (encounter engine)
**Files to create:** `ZoneDropEncounter.tsx`

### Behavior — Zone-Contextual Projectile
Each zone has its own "messenger object" that Po sends:
- **Workshop:** A guitar pick flicked across the screen
- **Gallery:** A paint splat that lands on the page
- **Librarynth:** A floating book page that drifts down
- **Contact:** A carrier pigeon that swoops across

The object lands on screen, is clickable, and opens the same note as Paper Plane ("do you want to talk to me?").

### Prompt for Implementation Session

```
TASK: Build the Zone Drop encounter trigger — zone-specific projectile encounters.

Create web/src/components/encounters/ZoneDropEncounter.tsx

This is a VARIANT of the Paper Plane that uses zone-themed objects.

ZONE OBJECTS (all pure CSS):
- Workshop: Guitar pick (triangle/shield shape, wood-brown color, amber edge)
  → flicked from left, spins, lands with a tiny bounce
- Gallery: Paint splat (abstract blob shape via border-radius, purple/violet)
  → drops from above, splats on landing (scale squish animation)
- Librarynth: Book page (rectangle with one curled corner, off-white, faint text lines)
  → floats down from top with gentle side-to-side sway
- Contact: Carrier pigeon (simplified bird shape, 4-frame CSS animation for wing flap)
  → flies in from left at slight downward angle, lands, folds wings

BEHAVIOR (same as Paper Plane T4):
1. 'entering': Object animates into viewport with zone-appropriate trajectory
2. 'waiting': Object sits for 8s. Click → note unfolds. Ignore → object leaves.
3. Note: Same "do you want to talk to me?" with yes/no checkboxes
4. 'exiting': Object animates out

The component reads zoneId from encounter context to select the right object variant.

ZONE CONFIG INTEGRATION:
Add to zone-config.ts:
- dropObject: { shape: 'pick' | 'splat' | 'page' | 'pigeon', color: string }

IMPORTANT:
- All objects are CSS-only (clip-path, border-radius, pseudo-elements)
- Each object should feel like it belongs to its zone's aesthetic
- prefers-reduced-motion: object appears at landing position directly
- Mobile: render at smaller scale, simpler trajectory
- Reuse the note/checkbox component from PaperPlaneEncounter (extract to shared component)
```

---

## TASK 9: Integration & Polish

**Priority:** LAST
**Dependencies:** T1-T8
**Files to modify:** `Sidebar.tsx`, root layout, `globals.css`

### Checklist
- [ ] Add PoEncounterProvider to root layout
- [ ] Render all encounter components inside layout (they self-gate via context)
- [ ] Remove "Talk to Po" button from Sidebar (organic triggers replace it)
- [ ] OR: Keep button but restyle as subtle "..." indicator that Po is available
- [ ] Encounter components render as fixed-position overlays (above content, below codec)
- [ ] Test cooldown system — encounters don't spam
- [ ] Test dismiss behavior — cooldown doubles correctly
- [ ] Test session cap — max 5 encounters then Po gives up
- [ ] Verify prefers-reduced-motion for all triggers
- [ ] Verify mobile behavior for all triggers
- [ ] Extract shared NoteOverlay component (used by Paper Plane + Zone Drop)

### Prompt for Integration Session

```
TASK: Wire up the complete Po Encounter System.

All components from Tasks 3-8 exist. Now integrate them.

1. Root layout (web/src/app/layout.tsx):
   - Add <PoEncounterProvider> wrapping children (alongside CodecProvider)

2. Create web/src/components/encounters/PoEncounterLayer.tsx:
   - Single component that renders ALL encounter triggers
   - Each trigger self-gates (only renders when its encounter type is active)
   - Fixed position overlay, z-index between content and codec
   - Import: PaperPlaneEncounter, KnockEncounter, CodecRingEncounter,
     CursorStalkEncounter, ZoneDropEncounter

3. Add <PoEncounterLayer /> to root layout (after main content, before CodecOverlay)

4. Sidebar.tsx:
   - Keep "Talk to Po" button BUT restyle as a subtle "•••" or remove text
   - It should still work as a manual override (direct codec open, bypasses encounter)
   - OR: Replace with a small Po emoji/icon that hints at availability

5. Shared components to extract:
   - encounters/NoteOverlay.tsx — the "do you want to talk to me?" note with checkboxes
     (used by PaperPlaneEncounter and ZoneDropEncounter)
   - encounters/SpeechBubble.tsx — the pixel-art speech bubble
     (used by KnockEncounter and CursorStalkEncounter)

6. Test scenarios:
   - Fresh zone visit → codec ring fires
   - Sit idle 12s → paper plane or knock
   - Scroll to bottom → zone drop
   - Ambient cursor tracking works
   - After 3 dismissals, cooldown is ~240s
   - After 5 encounters, engine stops for session
   - Manual "Talk to Po" still works anytime
```

---

## ART ASSETS TODO (Future)

These are NOT blocking implementation but should be queued:

- [ ] **Po codec portrait** — upper body, 128x128 PixelLab generation (T2)
- [ ] **Per-zone dossier data** — real stat tracking system for pentagon chart
- [ ] **Carrier pigeon sprite** — for contact zone drop (or pure CSS)
- [ ] **Sound effects** — knock sound, paper whoosh, codec ring tone (optional, future)
- [ ] **Crystal Bonsai variants** — different energy colors per zone?

---

## Execution Order

```
T1 (Codec V2) ─────────────────────┐
T2 (Po Portrait) ─── parallel ──────┤
                                    ▼
T3 (Encounter Engine) ─────────────┐
                                    ▼
T4 (Paper Plane) ──┐               │
T5 (Knock) ────────┤── parallel ───┤
T6 (Codec Ring) ───┤               │
T7 (Cursor Stalk) ─┤               │
T8 (Zone Drop) ────┘               │
                                    ▼
T9 (Integration & Polish) ─────────┘
```

T1 and T2 can run in parallel.
T4-T8 can ALL run in parallel once T3 is done.
T9 is the final assembly.
