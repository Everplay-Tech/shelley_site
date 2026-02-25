import { NextRequest, NextResponse } from "next/server";

// ─── Discord webhook contact form handler ───────────────────────────────────
// Posts formatted embed to Discord channel via webhook URL.
// Webhook URL stored in DISCORD_WEBHOOK_URL env var (Railway + .env.local).

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ContactPayload>;

    // ─── Validation ───
    const { name, email, message } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    if (!email || !isValidEmail(email.trim())) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      );
    }
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // ─── Rate limit hint (basic, per-deploy — not persistent) ───
    // For production, use Redis or similar. This is good enough for launch.

    // ─── Discord webhook ───
    if (!DISCORD_WEBHOOK_URL) {
      console.error("DISCORD_WEBHOOK_URL not configured");
      return NextResponse.json(
        { error: "Contact form is not configured yet. Please try again later." },
        { status: 503 }
      );
    }

    const discordEmbed = {
      embeds: [
        {
          title: "📬 New Contact Form Submission",
          color: 0xffbf00, // shelley-amber
          fields: [
            { name: "Name", value: name.trim(), inline: true },
            { name: "Email", value: email.trim(), inline: true },
            { name: "Message", value: message.trim().slice(0, 1024) },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: "shelleyguitar.com — Contact Form",
          },
        },
      ],
    };

    const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordEmbed),
    });

    if (!discordRes.ok) {
      console.error("Discord webhook failed:", discordRes.status, await discordRes.text());
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
