import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { AUTH_COOKIE, verifyAuthToken } from "@/lib/auth-helpers";

interface OrderRow {
  id: number;
  status: string;
  total_cents: number;
  currency: string;
  created_at: string;
}

interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_cents: number;
  product_name: string;
  product_type: string;
  image_url: string | null;
}

// GET /api/shop/orders — List orders for authenticated user
export async function GET() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let payload;
  try {
    payload = await verifyAuthToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    // Fetch orders
    const ordersResult = await query<OrderRow>(
      "SELECT id, status, total_cents, currency, created_at FROM orders WHERE account_id = $1 ORDER BY created_at DESC",
      [payload.accountId]
    );

    // Fetch items for all orders
    const orderIds = ordersResult.rows.map((o) => o.id);
    let items: OrderItemRow[] = [];
    if (orderIds.length > 0) {
      const itemsResult = await query<OrderItemRow>(
        `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price_cents,
                p.name AS product_name, p.product_type, p.image_url
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ANY($1)`,
        [orderIds]
      );
      items = itemsResult.rows;
    }

    // Group items by order
    const orders = ordersResult.rows.map((order) => ({
      ...order,
      items: items.filter((i) => i.order_id === order.id),
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[shop/orders] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
