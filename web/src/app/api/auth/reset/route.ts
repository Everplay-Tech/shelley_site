import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { query } from "@/lib/db";

// POST /api/auth/reset — Request password reset email
export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if account exists
  const existing = await query<{ id: number }>(
    "SELECT id FROM accounts WHERE email = $1",
    [normalizedEmail]
  );

  // Always return OK — don't reveal if email exists
  if (existing.rows.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    "INSERT INTO magic_tokens (email, token, purpose, expires_at) VALUES ($1, $2, $3, $4)",
    [normalizedEmail, token, "password_reset", expiresAt]
  );

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "po@shelleyguitar.com",
        to: normalizedEmail,
        subject: "Reset your Shelley Guitar password",
        html: `
          <div style="font-family: monospace; background: #1a1a1a; color: #fff; padding: 32px; max-width: 480px;">
            <h2 style="color: #ffbf00; font-size: 14px;">SHELLEY GUITAR</h2>
            <p style="color: #ccc;">Someone requested a password reset for your account.</p>
            <a href="${resetUrl}" style="display: inline-block; background: #ffbf00; color: #1a1a1a; padding: 12px 24px; text-decoration: none; font-weight: bold; margin: 16px 0;">
              RESET PASSWORD
            </a>
            <p style="color: #666; font-size: 12px;">This link expires in 1 hour. If you didn&apos;t request this, ignore this email — your password won&apos;t change.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[password-reset] Failed to send email:", err);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } else {
    console.log(
      `[password-reset] DEV MODE — Reset link for ${normalizedEmail}:\n${resetUrl}`
    );
  }

  return NextResponse.json({ ok: true });
}

// PUT /api/auth/reset — Set new password with token
export async function PUT(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token and password required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // Find valid token
  const result = await query<{
    email: string;
    expires_at: Date;
    used: boolean;
  }>(
    "SELECT email, expires_at, used FROM magic_tokens WHERE token = $1 AND purpose = 'password_reset'",
    [token]
  );

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

  // Update password
  const passwordHash = await hash(password, 12);
  await query("UPDATE accounts SET password_hash = $1 WHERE email = $2", [
    passwordHash,
    row.email,
  ]);

  return NextResponse.json({ ok: true });
}
