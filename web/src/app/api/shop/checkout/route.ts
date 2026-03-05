import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { AUTH_COOKIE, verifyAuthToken } from "@/lib/auth-helpers";

interface ProductRow {
  id: number;
  stripe_price_id: string;
  name: string;
  price_cents: number;
  product_type: string;
  active: boolean;
}

interface AccountRow {
  id: number;
  email: string;
  stripe_customer_id: string | null;
  rewards_earned: string[];
}

// Reward code → discount percent mapping
const REWARD_DISCOUNTS: Record<string, number> = {
  PO10: 10,
  BONDED15: 15,
  PICKS20: 20,
  SIX25: 25,
};

// POST /api/shop/checkout — Create Stripe Checkout Session
export async function POST(req: Request) {
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

  const body = await req.json();
  const { productId, rewardCode } = body as { productId: number; rewardCode?: string };

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  // Fetch product
  const productResult = await query<ProductRow>(
    "SELECT id, stripe_price_id, name, price_cents, product_type, active FROM products WHERE id = $1",
    [productId]
  );
  if (productResult.rows.length === 0 || !productResult.rows[0].active) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const product = productResult.rows[0];

  // Fetch account
  const accountResult = await query<AccountRow>(
    "SELECT id, email, stripe_customer_id, rewards_earned FROM accounts WHERE id = $1",
    [payload.accountId]
  );
  if (accountResult.rows.length === 0) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  const account = accountResult.rows[0];

  // Validate reward code if provided
  let discountPercent = 0;
  if (rewardCode) {
    const code = rewardCode.toUpperCase();
    if (!REWARD_DISCOUNTS[code]) {
      return NextResponse.json({ error: "Invalid reward code" }, { status: 400 });
    }
    if (!account.rewards_earned?.includes(code)) {
      return NextResponse.json({ error: "You haven't earned this reward" }, { status: 403 });
    }
    discountPercent = REWARD_DISCOUNTS[code];
  }

  try {
    // Create or reuse Stripe customer
    let customerId = account.stripe_customer_id;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: account.email,
        metadata: { accountId: String(account.id) },
      });
      customerId = customer.id;
      await query(
        "UPDATE accounts SET stripe_customer_id = $1 WHERE id = $2",
        [customerId, account.id]
      );
    }

    // Build checkout session params
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.shelleyguitar.com";

    // Build line items — apply discount by adjusting unit_amount
    const unitAmount = discountPercent > 0
      ? Math.round(product.price_cents * (1 - discountPercent / 100))
      : product.price_cents;

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: product.name },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        accountId: String(account.id),
        productId: String(product.id),
        rewardCode: rewardCode || "",
        discountPercent: String(discountPercent),
      },
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/cancel`,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("[shop/checkout] Stripe error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
