import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Default beats — baked into the Godot export. Overrides from DB replace matching beat lines.
// Keep this list in sync with godot/po_runner/data/narrative_beats.json
const DEFAULT_BEATS = [
  {
    id: "intro",
    trigger_type: "distance",
    trigger_distance: 200,
    lines: [
      "Oh hey! You're actually controlling me? Cool cool cool.",
      "Name's Po. Skeleton ghost. Fur-trimmed hoodie enthusiast.",
      "My memory gets fuzzy from time to time. And time... sometimes again times...",
      'Ah, Djinn World. Home. Pops told the palace guard to come find me, so I try to street rat it up and gather supplies for the adventures.',
      "Just help me jump over stuff. We'll find Captain Magus and figure out the rest via his idearrhea.",
    ],
  },
  {
    id: "workshop",
    trigger_type: "distance",
    trigger_distance: 500,
    lines: [
      "Hold up. You smell that? Sawdust and lacquer.",
      "And that THING the big cat dropped... what is it?",
      "It's warm. Humming. Like it wants to be part of something bigger.",
      "I think we're near a luthier's workshop.",
      "That's a guitar maker, fam.",
      "...Someone scattered these pieces on purpose. Keep moving.",
    ],
  },
  {
    id: "gallery",
    trigger_type: "distance",
    trigger_distance: 900,
    lines: [
      "Real talk for a second.",
      "You're still here. Playing a run game? That makes you an OG.",
      "You know there's a whole website behind this game, right? Like RIGHT behind it.",
      "Sign up. Save your progress. Get emails about cool stuff \u2014 builds, drops, music.",
      "Or don't. I'm not a cop.",
      "...OK back to running. Collecting them all leads to good things...",
    ],
  },
  {
    id: "invitation",
    trigger_type: "distance",
    trigger_distance: 1600,
    lines: [
      "FOUR pieces. Four out of... I don't even know how many.",
      "But I can FEEL them now. They're pulling me forward.",
      "There's a place up ahead \u2014 Shelley Guitar. Custom builds, wild designs.",
      "These pieces \u2014 they're connected to whoever built this place.",
      "Every time those big freaks show up, I get to MOVE for a second.",
      "Like the fight breaks the rules. Like the cage has cracks.",
    ],
  },
  {
    id: "the_break",
    trigger_type: "piece_collected",
    trigger_count: 6,
    lines: [
      "Wait. WAIT. What's happening?",
      "The world... it stopped. The scrolling. The endless running.",
      "SIX pieces. That's all six.",
      "We gotta get Magus.",
      "...",
      "Follow me.",
    ],
    signal: "morph_to_platformer",
  },
  {
    id: "first_steps",
    trigger_type: "post_morph_timer",
    trigger_delay: 30,
    lines: [
      "This is wild. Actual freedom of movement.",
      "There's a platform up there... and is that a DOOR?",
      "Captain Magus built this whole place. The architect. The mad scientist.",
      "I bet there's way more to find if we keep looking.",
    ],
  },
  {
    id: "magus_meeting",
    trigger_type: "area_entered",
    trigger_area: "amphitheatre",
    lines: [
      { speaker: "Po", text: "Captain? You're HERE?" },
      { speaker: "Magus", text: "Of course. Where'd you think I'd be?" },
      { speaker: "Po", text: "*stares off blankly....*" },
      { speaker: "Magus", text: "How's mom?" },
      { speaker: "Po", text: "*snaps back* I haven't called her in well over a week." },
      { speaker: "Magus", text: "Well don't just stand there \u2014 hand me that diamond coated file behind you." },
    ],
  },
  {
    id: "explore_complete",
    trigger_type: "area_entered",
    trigger_area: "exit_portal",
    lines: [
      "Alright! We cracked this place open.",
      "There's a whole site out there \u2014 builds, stories, music, everything.",
      "Go explore. I'll be around. I'm literally embedded in this website.",
      "And if you see any glowing orbs lying around... they're MINE.",
      "Po out. *morphs into the footer*",
    ],
    signal: "onboarding_complete",
  },
];

interface OverrideRow {
  beat_id: string;
  lines: unknown[];
  updated_at: string;
}

// ─── GET /api/narrative ─────────────────────────────────────────────────────
// Returns all beats merged with DB overrides. No auth required (Godot calls this).
export async function GET() {
  try {
    const overrides = await query<OverrideRow>(
      "SELECT beat_id, lines, updated_at FROM narrative_overrides"
    );

    const overrideMap = new Map<string, unknown[]>();
    for (const row of overrides.rows) {
      overrideMap.set(row.beat_id, row.lines);
    }

    // Merge: override lines replace default lines for matching beat IDs
    const merged = DEFAULT_BEATS.map((beat) => {
      const override = overrideMap.get(beat.id);
      if (override) {
        return { ...beat, lines: override, _overridden: true };
      }
      return beat;
    });

    return NextResponse.json({ beats: merged });
  } catch {
    // If DB unavailable, return defaults (graceful degradation)
    return NextResponse.json({ beats: DEFAULT_BEATS });
  }
}

// ─── POST /api/narrative ────────────────────────────────────────────────────
// Upsert a beat override. Requires ADMIN_SECRET.
export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      { error: "ADMIN_SECRET not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { secret, beatId, lines } = body as {
    secret?: string;
    beatId?: string;
    lines?: unknown[];
  };

  if (secret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!beatId || !Array.isArray(lines)) {
    return NextResponse.json(
      { error: "beatId (string) and lines (array) are required" },
      { status: 400 }
    );
  }

  // Validate beat ID exists in defaults
  const validBeatIds = DEFAULT_BEATS.map((b) => b.id);
  if (!validBeatIds.includes(beatId)) {
    return NextResponse.json(
      { error: `Invalid beatId. Valid: ${validBeatIds.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate lines format (each line is string or {speaker, text})
  for (const line of lines) {
    if (typeof line === "string") continue;
    if (
      typeof line === "object" &&
      line !== null &&
      "speaker" in line &&
      "text" in line
    ) {
      continue;
    }
    return NextResponse.json(
      {
        error:
          'Each line must be a string or {"speaker": "Name", "text": "..."}',
      },
      { status: 400 }
    );
  }

  // Upsert override
  await query(
    `INSERT INTO narrative_overrides (beat_id, lines, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (beat_id) DO UPDATE SET
       lines = $2,
       updated_at = NOW()`,
    [beatId, JSON.stringify(lines)]
  );

  return NextResponse.json({ ok: true, beatId });
}

// ─── DELETE /api/narrative ──────────────────────────────────────────────────
// Remove a beat override (revert to default). Requires ADMIN_SECRET.
export async function DELETE(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      { error: "ADMIN_SECRET not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { secret, beatId } = body as { secret?: string; beatId?: string };

  if (secret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!beatId) {
    return NextResponse.json(
      { error: "beatId is required" },
      { status: 400 }
    );
  }

  await query("DELETE FROM narrative_overrides WHERE beat_id = $1", [beatId]);

  return NextResponse.json({ ok: true, beatId, reverted: true });
}
