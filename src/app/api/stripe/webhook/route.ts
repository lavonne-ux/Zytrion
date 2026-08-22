import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getResendClient, EMAIL_FROM, FOUNDER_EMAIL } from "@/lib/email/resend";
import {
  paymentReceiptEmail,
  founderPurchasePingEmail,
  kitPurchaseReceiptEmail,
  founderKitPurchasePingEmail,
} from "@/lib/email/templates";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const assessmentId = session.metadata?.assessmentId;
    const kitId = session.metadata?.kit_id;
    const clientId = session.metadata?.client_id;

    // Kit purchase: creates the enrollment. Separate flow from the
    // Full Report path below, distinguished by kit_id/client_id
    // being present instead of assessmentId.
    if (kitId && clientId) {
      const supabase = createAdminClient();
      const kitTitle = session.metadata?.kit_title ?? "Implementation Kit";
      const amountCents = session.amount_total ?? 0;

      const { error: enrollError } = await supabase.from("client_kit_enrollments").insert({
        client_id: clientId,
        kit_id: kitId,
        status: "active",
        current_phase: 1,
      });
      if (enrollError) {
        console.error("Kit enrollment failed to save:", enrollError.message);
      }

      const { error: paymentError } = await supabase.from("payments").insert({
        client_id: clientId,
        product: kitTitle,
        amount_cents: amountCents,
        status: "succeeded",
        stripe_reference: session.id,
      });
      if (paymentError) {
        console.error("Kit payment record failed to save:", paymentError.message);
      }

      // Receipt to the client, plus a founder notification. Both ride
      // the same confirmed event. A failure here must never affect
      // the enrollment or payment record above, which already
      // succeeded, so this is caught and logged, not thrown.
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("contact_name, business_name, contact_email")
          .eq("id", clientId)
          .single();

        const resend = getResendClient();
        if (resend && profile?.contact_email) {
          const portalUrl = "https://www.getzytrion.com/portal";

          const receipt = kitPurchaseReceiptEmail({
            contactName: profile.contact_name || "there",
            kitTitle,
            amountCents,
            portalUrl,
          });
          await resend.emails.send({
            from: EMAIL_FROM,
            to: profile.contact_email,
            subject: receipt.subject,
            html: receipt.html,
          });

          const ping = founderKitPurchasePingEmail({
            businessName: profile.business_name || profile.contact_name || "Unknown",
            contactName: profile.contact_name || "Unknown",
            contactEmail: profile.contact_email,
            kitTitle,
            amountCents,
          });
          await resend.emails.send({
            from: EMAIL_FROM,
            to: FOUNDER_EMAIL,
            subject: ping.subject,
            html: ping.html,
          });
        }
      } catch (err) {
        console.error("Kit purchase confirmation email(s) failed to send:", err);
      }

      return NextResponse.json({ received: true });
    }

    // Full Report purchase: existing flow, tied to an assessment
    // rather than an authenticated client.
    if (assessmentId) {
      const supabase = createAdminClient();
      const { data: assessment } = await supabase
        .from("assessments")
        .update({
          full_report_paid_at: new Date().toISOString(),
          stripe_checkout_session_id: session.id,
        })
        .eq("id", assessmentId)
        .select("id, contact_name, contact_business, contact_email, total_score, tiers ( name )")
        .single();

      if (assessment) {
        try {
          const resend = getResendClient();
          if (resend) {
            const businessName = assessment.contact_business || assessment.contact_name;
            const tierName = (assessment as any).tiers?.name ?? "";
            const resultsUrl = `https://www.getzytrion.com/results/${assessmentId}?report=paid`;

            const receipt = paymentReceiptEmail({
              contactName: assessment.contact_name,
              businessName,
              resultsUrl,
            });
            await resend.emails.send({
              from: EMAIL_FROM,
              to: assessment.contact_email,
              subject: receipt.subject,
              html: receipt.html,
            });

            const ping = founderPurchasePingEmail({
              businessName,
              contactName: assessment.contact_name,
              contactEmail: assessment.contact_email,
              totalScore: assessment.total_score,
              tierName,
              resultsUrl,
            });
            await resend.emails.send({
              from: EMAIL_FROM,
              to: FOUNDER_EMAIL,
              subject: ping.subject,
              html: ping.html,
            });
          }
        } catch (err) {
          console.error("Payment confirmation email(s) failed to send:", err);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
