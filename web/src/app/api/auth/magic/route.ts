import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { query } from "@/lib/db";
import {
  AUTH_COOKIE,
  SESSION_COOKIE,
  COOKIE_MAX_AGE,
  createAuthToken,
} from "@/lib/auth-helpers";

// POST /api/auth/magic — Send magic link
export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    "INSERT INTO magic_tokens (email, token, expires_at) VALUES ($1, $2, $3)",
    [normalizedEmail, token, expiresAt]
  );

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const magicUrl = `${baseUrl}/auth/verify?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "po@shelleyguitar.com",
        to: normalizedEmail,
        subject: "Your Shelley Guitar magic link",
        html: `
          <div style="font-family: monospace; background: #1a1a1a; color: #fff; padding: 32px; max-width: 480px;">
            <h2 style="color: #ffbf00; font-size: 14px;">SHELLEY GUITAR</h2>
            <p style="color: #ccc;">Click below to sign in:</p>
            <a href="${magicUrl}" style="display: inline-block; background: #ffbf00; color: #1a1a1a; padding: 12px 24px; text-decoration: none; font-weight: bold; margin: 16px 0;">
              ENTER THE WORKSHOP
            </a>
            <p style="color: #666; font-size: 12px;">This link expires in 1 hour. If you didn&apos;t request this, ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[magic-link] Failed to send email:", err);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } else {
    console.log(
      `[magic-link] DEV MODE — Magic link for ${normalizedEmail}:\n${magicUrl}`
    );
  }

  return NextResponse.json({ ok: true });
}

// GET /api/auth/magic?token=xxx — Verify magic link
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const result = await query<{
    email: string;
    expires_at: Date;
    used: boolean;
  }>("SELECT email, expires_at, used FROM magic_tokens WHERE token = $1", [
    token,
  ]);

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const row = result.rows[0];
  if (row.used) {
    return NextResponse.json(
      { error: "Token already used" },
      { status: 400 }
    );
  }
  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  // Mark as used
  await query("UPDATE magic_tokens SET used = TRUE WHERE token = $1", [token]);

  // Find or create account
  const existing = await query<{ id: number; email: string }>(
    "SELECT id, email FROM accounts WHERE email = $1",
    [row.email]
  );

  let accountId: number;
  let accountEmail: string;

  if (existing.rows.length > 0) {
    accountId = existing.rows[0].id;
    accountEmail = existing.rows[0].email;
  } else {
    // Create account with empty password (magic-link only)
    // compare() will always return false for empty hash, so password login won't work
    const created = await query<{ id: number; email: string }>(
      "INSERT INTO accounts (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email",
      [row.email, "", null]
    );
    accountId = created.rows[0].id;
    accountEmail = created.rows[0].email;
  }

  const authToken = await createAuthToken(accountId, accountEmail);

  // Link anonymous session to account
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await query(
      "UPDATE game_progress SET account_id = $1 WHERE session_id = $2 AND account_id IS NULL",
      [accountId, sessionId]
    );
  }

  const response = NextResponse.json({ ok: true, accountId });
  response.cookies.set(AUTH_COOKIE, authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}
