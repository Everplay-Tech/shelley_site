import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { query } from "@/lib/db";

const SESSION_COOKIE = "shelley_session";
const AUTH_COOKIE = "shelley_auth";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("[auth] CRITICAL: JWT_SECRET is not set in production!");
}
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "shelley-dev-secret-change-in-prod"
);
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface AccountRow {
  id: number;
  email: string;
  password_hash: string;
  display_name: string | null;
}

// POST /api/auth — Signup, login, or logout
// Body: { action: "signup" | "login" | "logout", email?, password?, displayName? }
export async function POST(req: Request) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "signup": {
      const { email, password, displayName } = body;
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password required" }, { status: 400 });
      }

      // Check if email already exists
      const existing = await query<AccountRow>(
        "SELECT id FROM accounts WHERE email = $1",
        [email.toLowerCase()]
      );
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }

      const passwordHash = await hash(password, 12);
      const result = await query<AccountRow>(
        "INSERT INTO accounts (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email",
        [email.toLowerCase(), passwordHash, displayName ?? null]
      );

      const accountId = result.rows[0].id;

      // Link session to account
      const sessionId = cookies().get(SESSION_COOKIE)?.value;
      if (sessionId) {
        await query(
          "UPDATE game_progress SET account_id = $1 WHERE session_id = $2",
          [accountId, sessionId]
        );
      }

      // Set auth JWT cookie
      const token = await new SignJWT({ accountId, email: email.toLowerCase() })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(JWT_SECRET);

      const response = NextResponse.json({ ok: true, accountId });
      response.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
      return response;
    }

    case "login": {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password required" }, { status: 400 });
      }

      const result = await query<AccountRow>(
        "SELECT id, email, password_hash FROM accounts WHERE email = $1",
        [email.toLowerCase()]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const account = result.rows[0];
      const valid = await compare(password, account.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      // Link current session to account (merges anonymous progress)
      const sessionId = cookies().get(SESSION_COOKIE)?.value;
      if (sessionId) {
        await query(
          "UPDATE game_progress SET account_id = $1 WHERE session_id = $2 AND account_id IS NULL",
          [account.id, sessionId]
        );
      }

      const token = await new SignJWT({ accountId: account.id, email: account.email })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(JWT_SECRET);

      const response = NextResponse.json({ ok: true, accountId: account.id });
      response.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
      return response;
    }

    case "logout": {
      const response = NextResponse.json({ ok: true });
      response.cookies.delete(AUTH_COOKIE);
      return response;
    }

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}

// GET /api/auth — Check auth status
export async function GET() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return NextResponse.json({
      authenticated: true,
      accountId: payload.accountId,
      email: payload.email,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
