import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

// Real Stripe Price created directly through the Stripe API for the
// printed, bound edition of the Manual. $397 flat, shipping included.
// Separate Price from the digital PDF (price_1U8b5YDamHQxgFP2lVBqiMxi),
// this is a physical good with real fulfillment cost behind it.
const MANUAL_PRINT_PRICE_ID = "price_1UHutcDamHQxgFP21t5RYrab";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Same login requirement as the digital Manual purchase: a real
  // account to tie the order and shipping address to, and a place to
  // send order status if that's ever added to the portal later.
  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to purchase the printed Manual." },
      { status: 401 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = req.headers.get("origin") || "https://www.getzytrion.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    allow_promotion_codes: true,
    line_items: [{ price: MANUAL_PRINT_PRICE_ID, quantity: 1 }],
    metadata: { client_id: user.id, product: "manual_print" },
    customer_email: user.email,
    // The actual address capture and validation: Stripe renders the
    // shipping form itself (country-correct fields, required-field and
    // postal-code-format checks) and returns a structured address on
    // the completed session. US only for now, see manual_print_orders
    // migration notes; widening this to more countries later is a
    // one-line change here, not a rebuild.
    shipping_address_collection: { allowed_countries: ["US"] },
    phone_number_collection: { enabled: true },
    success_url: `${origin}/portal?manual_print=1`,
    cancel_url: `${origin}/store?purchase=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
