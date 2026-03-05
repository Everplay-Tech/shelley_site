import { NextResponse } from "next/server";
import { query } from "@/lib/db";

interface ProductRow {
  id: number;
  stripe_product_id: string | null;
  stripe_price_id: string;
  name: string;
  description: string;
  product_type: string;
  content_type: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

// GET /api/shop/products — Public product listing
export async function GET() {
  try {
    const result = await query<ProductRow>(
      "SELECT id, name, description, product_type, content_type, price_cents, currency, image_url, metadata, created_at FROM products WHERE active = true ORDER BY created_at DESC"
    );

    return NextResponse.json({ products: result.rows });
  } catch (err) {
    console.error("[shop/products] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
