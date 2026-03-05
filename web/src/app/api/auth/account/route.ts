import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hash, compare } from "bcryptjs";
import { query } from "@/lib/db";
import { AUTH_COOKIE, verifyAuthToken } from "@/lib/auth-helpers";

interface AccountRow {
  id: number;
  email: string;
  password_hash: string;
  display_name: string | null;
}

// Helper: get authenticated account
async function getAccount(): Promise<AccountRow | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyAuthToken(token);
    const result = await query<AccountRow>(
      "SELECT id, email, password_hash, display_name FROM accounts WHERE id = $1",
      [payload.accountId]
    );
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

// PUT /api/auth/account — Update account settings
// Body: { action: "update_name" | "change_password" | "set_password", ... }
export async function PUT(req: Request) {
  const account = await getAccount();
  if (!account) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "update_name": {
      const { displayName } = body;
      if (typeof displayName !== "string") {
        return NextResponse.json({ error: "Display name required" }, { status: 400 });
      }

      const trimmed = displayName.trim();
      if (trimmed.length > 30) {
        return NextResponse.json({ error: "Display name too long (max 30)" }, { status: 400 });
      }

      await query("UPDATE accounts SET display_name = $1 WHERE id = $2", [
        trimmed || null,
        account.id,
      ]);

      return NextResponse.json({ ok: true, displayName: trimmed || null });
    }

    case "change_password": {
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "Current and new password required" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Verify current password
      const valid = await compare(currentPassword, account.password_hash);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }

      const passwordHash = await hash(newPassword, 12);
      await query("UPDATE accounts SET password_hash = $1 WHERE id = $2", [
        passwordHash,
        account.id,
      ]);

      return NextResponse.json({ ok: true });
    }

    case "set_password": {
      // For magic-link-only accounts (empty password_hash)
      const { newPassword } = body;
      if (!newPassword) {
        return NextResponse.json(
          { error: "Password required" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Only allow if account has no password set
      if (account.password_hash && account.password_hash.length > 0) {
        return NextResponse.json(
          { error: "Account already has a password. Use change_password instead." },
          { status: 400 }
        );
      }

      const passwordHash = await hash(newPassword, 12);
      await query("UPDATE accounts SET password_hash = $1 WHERE id = $2", [
        passwordHash,
        account.id,
      ]);

      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}

// GET /api/auth/account — Get account details (including hasPassword flag)
export async function GET() {
  const account = await getAccount();
  if (!account) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    email: account.email,
    displayName: account.display_name,
    hasPassword: account.password_hash.length > 0,
  });
}
