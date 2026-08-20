import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Recurring (subscription) prices must use Checkout mode "subscription".
// Every other price on the ladder is one-time and uses mode "payment".
const RECURRING_PRICE_IDS = new Set([
  "price_1U6NA8DamHQxgFP2u2SllUj6", // Zytrion Membership - Standard
  "price_1U6NA9DamHQxgFP2znG5X2NK", // Zytrion Membership - Pro
  "price_1U6NA9DamHQxgFP2oG37UGu1", // Zytrion Membership - Enterprise
]);

// The Full Report is the only purchase type gated by an "already paid"
// check right now, since that check reads a Report-specific column.
const FULL_REPORT_PRICE_ID = process.env.STRIPE_PRICE_ID!;

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { assessmentId, priceId } = await req.json();

  if (!assessmentId) {
    return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });
  }

  // Defaults to the Full Report price if none is passed, so the existing
  // Report purchase flow keeps working exactly as it does today.
  const selectedPriceId = priceId || FULL_REPORT_PRICE_ID;

  const supabase = createAdminClient();
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, contact_email, full_report_paid_at")
    .eq("id", assessmentId)
    .single();

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (selectedPriceId === FULL_REPORT_PRICE_ID && assessment.full_report_paid_at) {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || "https://zytrion.vercel.app";
  const mode: "payment" | "subscription" = RECURRING_PRICE_IDS.has(selectedPriceId)
    ? "subscription"
    : "payment";

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: selectedPriceId, quantity: 1 }],
    customer_email: assessment.contact_email || undefined,
    metadata: { assessmentId: assessment.id, priceId: selectedPriceId },
    success_url: `${origin}/results/${assessment.id}?report=paid&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/results/${assessment.id}?report=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
