import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { readFile } from "fs/promises";
import path from "path";
import { query } from "@/lib/db";
import { AUTH_COOKIE, verifyAuthToken } from "@/lib/auth-helpers";

interface OwnershipRow {
  id: number;
  file_key: string | null;
  product_name: string;
}

// GET /api/library/download/[id] — Download a library item file
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const itemId = parseInt(params.id, 10);
  if (isNaN(itemId)) {
    return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
  }

  try {
    // Verify ownership
    const result = await query<OwnershipRow>(
      `SELECT li.id, p.file_key, p.name as product_name
       FROM library_items li
       JOIN products p ON p.id = li.product_id
       WHERE li.id = $1 AND li.account_id = $2`,
      [itemId, accountId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Item not found or not owned" }, { status: 404 });
    }

    const { file_key, product_name } = result.rows[0];

    if (!file_key) {
      return NextResponse.json({ error: "No file available for this item" }, { status: 404 });
    }

    // Resolve file path (file_key is relative to private/library/)
    const filePath = path.join(process.cwd(), "private", "library", file_key);

    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(filePath);
    } catch {
      console.error(`[library/download] File not found: ${filePath}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Increment download count
    await query(
      `UPDATE library_items
       SET download_count = download_count + 1, last_downloaded_at = NOW()
       WHERE id = $1`,
      [itemId]
    );

    // Determine content type from extension
    const ext = path.extname(file_key).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".flac": "audio/flac",
      ".zip": "application/zip",
      ".cbz": "application/x-cbz",
      ".epub": "application/epub+zip",
      ".png": "image/png",
      ".jpg": "image/jpeg",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    // Sanitize filename for Content-Disposition
    const safeFileName = `${product_name.replace(/[^a-zA-Z0-9_\- ]/g, "")}${ext}`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (err) {
    console.error("[library/download] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
