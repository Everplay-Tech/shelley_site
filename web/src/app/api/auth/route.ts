import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hash, compare } from "bcryptjs";
import { query } from "@/lib/db";
import {
  SESSION_COOKIE,
  AUTH_COOKIE,
  COOKIE_MAX_AGE,
  createAuthToken,
  verifyAuthToken,
} from "@/lib/auth-helpers";

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
      const token = await createAuthToken(accountId, email.toLowerCase());

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

      const token = await createAuthToken(account.id, account.email);

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
    const payload = await verifyAuthToken(token);

    // Fetch display_name from DB
    const result = await query<{ display_name: string | null }>(
      "SELECT display_name FROM accounts WHERE id = $1",
      [payload.accountId]
    );

    return NextResponse.json({
      authenticated: true,
      accountId: payload.accountId,
      email: payload.email,
      displayName: result.rows[0]?.display_name ?? null,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
