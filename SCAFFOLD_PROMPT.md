# Shelley Site Scaffold Prompt

Scaffold the Shelley Guitars website in this repo.

Shelley Guitars is a lutherie (guitar building) brand. This site has a unique concept: a mascot character named "Po" navigates the site as a game character. Instead of loading screens, there are optional mini-games. The site embeds Godot 4.3+ web games via iframes that communicate with the host page through postMessage.

**Tech stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, deployed to Vercel.

**Project structure I need:**

```
shelley_site/
├── web/                          # Next.js app
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── layout.tsx        # Root layout with nav, Po game container
│   │   │   ├── page.tsx          # Landing/home
│   │   │   ├── workshop/page.tsx # Workshop section
│   │   │   ├── gallery/page.tsx  # Guitar gallery
│   │   │   ├── about/page.tsx    # About Shelley
│   │   │   └── contact/page.tsx  # Contact
│   │   ├── components/
│   │   │   ├── GodotEmbed.tsx    # iframe wrapper for Godot games, handles postMessage
│   │   │   ├── MiniGameTransition.tsx  # Plays a mini-game during page transitions
│   │   │   ├── Navigation.tsx    # Site nav (Po interacts with this)
│   │   │   └── PoStatus.tsx      # Shows Po's current state/score
│   │   ├── hooks/
│   │   │   └── useGodotBridge.ts # postMessage communication hook (send commands, receive events)
│   │   ├── lib/
│   │   │   └── godot-messages.ts # Type definitions for Godot <-> site message protocol
│   │   └── styles/
│   │       └── globals.css       # Tailwind + custom styles
│   ├── public/
│   │   └── games/                # Where Godot .pck and .wasm exports go
│   │       ├── po_runner/        # Runner mini-game export
│   │       └── site_navigator/   # Future: Po site navigator export
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── godot/                        # Godot source projects (not deployed, built separately)
│   ├── po_runner/                # Runner mini-game source
│   ├── site_navigator/           # Po site navigator source
│   └── shared_assets/            # Shared sprites, audio
├── .gitignore
└── README.md
```

**Key requirements for the GodotEmbed component:**
- Renders an iframe pointing to the Godot HTML5 export in `/games/{gameName}/index.html`
- Sends commands to Godot via postMessage: `{ command: "start" | "pause" | "move_to", data?: any }`
- Receives events from Godot via message listener: `{ type: "navigate" | "minigame_complete" | "player_state", data?: any }`
- Handles loading states, error states, and responsive sizing
- COOP/COEP headers are NOT needed (games export single-threaded)

**Key requirements for MiniGameTransition:**
- Intercepts route changes
- Optionally shows a Godot mini-game (like the runner) instead of a blank loading screen
- User can skip with Escape or a skip button
- On `minigame_complete` message, proceeds to the new route

**For each page**, just create a clean placeholder with the section name, a brief description div, and a slot where Godot content can be embedded. We'll build the real content later.

**Don't worry about:** Authentication, CMS, database, or backend API. This is a static/SSG site with embedded games. Keep it simple.

**Do worry about:** The postMessage bridge being clean and typed, the iframe embedding being responsive, and the project structure being right. We'll be building heavily on top of this scaffold.

Initialize git, install dependencies, make sure `npm run dev` works.
