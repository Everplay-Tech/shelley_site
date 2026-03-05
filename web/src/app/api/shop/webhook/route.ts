import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

// Lazy — avoid crashing at build time when env var is missing
const getWebhookSecret = () => process.env.STRIPE_WEBHOOK_SECRET!;

// POST /api/shop/webhook — Stripe webhook handler
export async function POST(req: Request) {
  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};

    const accountId = parseInt(metadata.accountId, 10);
    const productId = parseInt(metadata.productId, 10);

    if (!accountId || !productId) {
      console.error("[webhook] Missing metadata:", metadata);
      return NextResponse.json({ received: true });
    }

    try {
      // Create order
      const orderResult = await query<{ id: number }>(
        `INSERT INTO orders (account_id, stripe_checkout_session_id, stripe_payment_intent_id, status, total_cents, currency, metadata)
         VALUES ($1, $2, $3, 'paid', $4, $5, $6)
         RETURNING id`,
        [
          accountId,
          session.id,
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
          session.amount_total ?? 0,
          session.currency ?? "usd",
          JSON.stringify(metadata),
        ]
      );
      const orderId = orderResult.rows[0].id;

      // Fetch product for price + type
      const productResult = await query<{
        price_cents: number;
        product_type: string;
      }>(
        "SELECT price_cents, product_type FROM products WHERE id = $1",
        [productId]
      );

      if (productResult.rows.length > 0) {
        const product = productResult.rows[0];

        // Create order item
        await query(
          "INSERT INTO order_items (order_id, product_id, quantity, price_cents) VALUES ($1, $2, 1, $3)",
          [orderId, productId, product.price_cents]
        );

        // Grant digital items to library
        if (product.product_type === "digital") {
          await query(
            `INSERT INTO library_items (account_id, product_id, source, order_id)
             VALUES ($1, $2, 'purchase', $3)
             ON CONFLICT (account_id, product_id) DO NOTHING`,
            [accountId, productId, orderId]
          );
        }
      }

      console.log(
        `[webhook] Order #${orderId} created for account ${accountId}, product ${productId}`
      );
    } catch (err) {
      console.error("[webhook] Error processing checkout:", err);
      // Return 200 to Stripe so it doesn't retry indefinitely
    }
  }

  return NextResponse.json({ received: true });
}
