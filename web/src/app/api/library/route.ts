import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { AUTH_COOKIE, verifyAuthToken } from "@/lib/auth-helpers";

interface LibraryRow {
  id: number;
  source: string;
  granted_at: string;
  download_count: number;
  product_name: string;
  product_description: string;
  content_type: string | null;
  image_url: string | null;
}

// GET /api/library — List owned library items for authenticated user
export async function GET() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let accountId: number;
  try {
    const payload = await verifyAuthToken(token);
    accountId = payload.accountId;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const result = await query<LibraryRow>(
      `SELECT
        li.id,
        li.source,
        li.granted_at,
        li.download_count,
        p.name as product_name,
        p.description as product_description,
        p.content_type,
        p.image_url
      FROM library_items li
      JOIN products p ON p.id = li.product_id
      WHERE li.account_id = $1
      ORDER BY li.granted_at DESC`,
      [accountId]
    );

    const items = result.rows.map((row) => ({
      id: row.id,
      product: {
        name: row.product_name,
        description: row.product_description,
        contentType: row.content_type,
        imageUrl: row.image_url,
      },
      source: row.source,
      grantedAt: row.granted_at,
      downloadCount: row.download_count,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[library] Database error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
