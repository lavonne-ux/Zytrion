import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { kitId, priceType } = await req.json();
  if (!kitId || (priceType !== "standard" && priceType !== "extended")) {
    return NextResponse.json({ error: "Missing or invalid kitId/priceType." }, { status: 400 });
  }

  const { data: kit } = await supabase
    .from("kits")
    .select("id, title, kit_type, stripe_price_id_standard, stripe_price_id_extended")
    .eq("id", kitId)
    .single();
  if (!kit) {
    return NextResponse.json({ error: "Kit not found." }, { status: 404 });
  }

  // Every kit except Sprint still requires an existing account, exactly
  // as before. Sprint alone can be purchased without logging in first,
  // the Stripe webhook creates the account automatically on payment.
  if (!user && kit.kit_type !== "sprint") {
    return NextResponse.json(
      { error: "You must be logged in to purchase a kit." },
      { status: 401 }
    );
  }

  const priceId =
    priceType === "extended" ? kit.stripe_price_id_extended : kit.stripe_price_id_standard;
  if (!priceId) {
    return NextResponse.json({ error: "No price configured for this kit." }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = req.headers.get("origin") || "https://www.getzytrion.com";

  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: user
      ? { client_id: user.id, kit_id: kit.id, kit_title: kit.title }
      : { kit_id: kit.id, kit_title: kit.title },
    success_url: user
      ? `${origin}/portal?enrolled=1`
      : `${origin}/login?enrolled=1`,
    cancel_url: user
      ? `${origin}/portal?purchase=cancelled`
      : `${origin}/store?purchase=cancelled`,
  };
  if (user?.email) {
    checkoutParams.customer_email = user.email;
  }

  const session = await stripe.checkout.sessions.create(checkoutParams);

  return NextResponse.json({ url: session.url });
}
