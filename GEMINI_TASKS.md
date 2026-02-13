# Gemini Task Queue — Shelley Site

These are scoped, in-depth tasks for Gemini to build piece by piece. Each task is self-contained with clear inputs, outputs, and acceptance criteria. Build them thoroughly — take your time, read the existing code first, match patterns.

---

## Task 1: Landing Page with Cookie-Based Game Swap

**File:** `web/src/app/page.tsx`
**Reads:** `web/src/lib/game-routes.ts`, `web/src/lib/cookies.ts`, `web/src/components/GodotEmbed.tsx`

**What to build:**
The landing page (`/`) should detect whether the user is a first-time or returning visitor using a cookie (`shelley_onboarded`). Based on that:

- **First visit (no cookie):** Embed the `po_runner` game. This is the onboarding experience — Po runs through an endless runner with narrative pause points where he introduces the user to Shelley Guitars. Listen for the `onboarding_complete` event from Godot and set the `shelley_onboarded` cookie when received.
- **Returning visit (cookie exists):** Embed the `po_moped` game instead — a space-invader style game where Po flies a moped shooting down vintage guitars raining from above.

**Use:**
- `getLandingGame(isReturning)` from `@/lib/game-routes` to get the game config
- `hasCookie()` and `setCookie()` from `@/lib/cookies`
- `GodotEmbed` with a ref to get `sendCommand` if needed
- Listen for `onboarding_complete` event type

**Keep:** The existing page structure (hero section, section cards, site navigator embed). Just swap the main game embed and add the cookie logic.

**Acceptance:** `npm run build` passes. Component is `"use client"`. Cookie is set on `onboarding_complete`. Game name changes based on cookie state.

---

## Task 2: PoStatus Component — Wire to Bridge Events

**File:** `web/src/components/PoStatus.tsx`
**Reads:** `web/src/lib/godot-messages.ts`, `web/src/hooks/useGodotBridge.ts`

**What to build:**
PoStatus currently shows hardcoded placeholder state. Make it reactive:

- Listen for `player_state` events from any active Godot game via a global event bus or by having TransitionContext forward events
- Update mood, score, and action in real time
- Listen for `narrative_start` / `narrative_end` events — when a narrative beat is playing, show a subtle indicator (e.g. "Po is talking..." with a pulse animation)
- When no game is active, show a resting state

**Design consideration:** PoStatus lives in the layout header, but game events come from iframes inside page content or the transition overlay. You'll need a way to bubble events up. Consider adding an `onGodotEvent` callback to TransitionContext, or creating a lightweight event emitter in `web/src/lib/`.

**Acceptance:** `npm run build` passes. Status updates when a `player_state` event is received. Shows narrative indicator during `narrative_start`/`narrative_end`.

---

## Task 3: Navigation Component — Transition-Aware Links

**File:** `web/src/components/Navigation.tsx`
**Reads:** `web/src/components/TransitionContext.tsx`, `web/src/lib/game-routes.ts`

**What to build:**
Currently the nav uses plain `<Link>` components. Make them transition-aware:

- When a nav link is clicked and the target route has a game in `game-routes.ts`, call `startTransition(url)` from TransitionContext instead of navigating directly
- If the route has no game, navigate normally
- Add a visual indicator on links that have a game (subtle icon, glow, or badge — keep it tasteful)
- While a transition is active (`isActive`), disable nav links

**Important:** Use `useTransition()` hook. The click handler should `e.preventDefault()` and call `startTransition(href)`.

**Acceptance:** `npm run build` passes. Clicking a game-enabled route triggers the transition overlay. Non-game routes navigate normally. Nav is disabled during transitions.

---

## Task 4: Per-Route Page Shells with Godot Embed Slots

**Files:** `web/src/app/workshop/page.tsx`, `web/src/app/gallery/page.tsx`, `web/src/app/about/page.tsx`, `web/src/app/contact/page.tsx`

**What to build:**
Each page should have:

1. A hero section with the page title and description (already exists in placeholder form)
2. A GodotEmbed slot that loads the route's game (from `game-routes.ts`)
3. A fallback UI when the game files don't exist yet (friendly message, not an error)
4. Content sections below the game embed (placeholder content is fine, but make the layout feel intentional)

**Use** `getGameForRoute(pathname)` to look up the game config. Use `usePathname()` from `next/navigation`.

**Each page has its own flavor:**
- **Workshop:** Build/craft theme. Game slot is prominent. Below: process steps (wood selection → shaping → finishing → setup)
- **Gallery:** Visual grid below the game. Placeholder cards for guitar images.
- **About:** Story-driven. Game slot is smaller. Below: narrative sections about Shelley, Po, the philosophy.
- **Contact:** Form below the game. Keep the existing form structure.

**Acceptance:** `npm run build` passes. Each page shows its game name in the embed. Fallback shows when game isn't exported yet.

---

## Task 5: Environment Config for MENTORR API

**File:** `web/src/lib/api.ts` (new), `web/.env.example` (new)

**What to build:**
Create a typed API client config for the MENTORR API:

- Read `NEXT_PUBLIC_API_URL` from environment (defaults to `https://mentorr-api-production.up.railway.app`)
- Export a simple `fetchApi(path, options?)` helper that prepends the base URL
- Create `.env.example` documenting available env vars
- Do NOT build actual API calls yet — just the plumbing

**Acceptance:** `npm run build` passes. `.env.example` exists with documented vars. `api.ts` exports a typed fetch wrapper.

---

## General Rules for All Tasks

1. **Read before writing.** Always read the file you're modifying and its imports first.
2. **Match existing patterns.** Look at how other components are structured. Follow the same conventions.
3. **Types over `any`.** Use the discriminated unions in `godot-messages.ts`. Never use `any`.
4. **`"use client"` on interactive components.** Server components can't use hooks or browser APIs.
5. **Don't break the build.** Run `npm run build` in `web/` after every change.
6. **One task at a time.** Complete and verify each task before starting the next.
