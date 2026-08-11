import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { assessmentId } = await req.json();

  if (!assessmentId) {
    return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, contact_email, full_report_paid_at")
    .eq("id", assessmentId)
    .single();

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (assessment.full_report_paid_at) {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || "https://zytrion.vercel.app";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    customer_email: assessment.contact_email || undefined,
    metadata: { assessmentId: assessment.id },
    success_url: `${origin}/results/${assessment.id}?report=paid&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/results/${assessment.id}?report=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
