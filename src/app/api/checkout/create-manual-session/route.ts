import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

// Real Stripe Price created directly by LaVonne in the Stripe Dashboard,
// live mode. $197, one-time. Not stored in the kits table, the Manual
// isn't a phased Kit, it's a single digital unlock, closer to Full
// Report than to Tier 1-4.
const MANUAL_PRICE_ID = "price_1U8b5YDamHQxgFP2lVBqiMxi";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The Manual is a re-downloadable digital purchase, tied to a real
  // account so a client can come back later without paying twice.
  // Unlike Sprint, there's no natural anonymous identifier to attach
  // an unauthenticated purchase to, so login is required here.
  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to purchase the Manual." },
      { status: 401 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = req.headers.get("origin") || "https://www.getzytrion.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    allow_promotion_codes: true,
    line_items: [{ price: MANUAL_PRICE_ID, quantity: 1 }],
    metadata: { client_id: user.id, product: "manual" },
    customer_email: user.email,
    success_url: `${origin}/portal?manual=1`,
    cancel_url: `${origin}/store?purchase=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
