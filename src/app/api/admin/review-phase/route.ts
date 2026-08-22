import { NextRequest, NextResponse } from "next/server";
import { getAdminStatus } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, EMAIL_FROM } from "@/lib/email/resend";
import { phaseReviewDecisionEmail } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { progressId, decision, reviewerNotes } = await req.json();
  if (!progressId || !["approved", "needs_revision"].includes(decision)) {
    return NextResponse.json({ error: "Missing or invalid progressId/decision." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: progress, error } = await admin
    .from("client_phase_progress")
    .update({
      review_status: decision,
      reviewer_notes: reviewerNotes ?? null,
    })
    .eq("id", progressId)
    .select("client_id, kit_phase_id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Could not save review.", detail: error.message },
      { status: 500 }
    );
  }

  // Decision email to the client. A failure here must never affect the
  // review decision above, which already saved, so this is caught and
  // logged, not thrown.
  try {
    if (progress) {
      const { data: profile } = await admin
        .from("profiles")
        .select("contact_name, contact_email")
        .eq("id", progress.client_id)
        .single();

      const { data: phase } = await admin
        .from("kit_phases")
        .select("title, kits ( title )")
        .eq("id", progress.kit_phase_id)
        .single();

      const resend = getResendClient();
      if (resend && profile?.contact_email && phase) {
        const notice = phaseReviewDecisionEmail({
          contactName: profile.contact_name || "there",
          kitTitle: (phase as any).kits?.title ?? "Kit",
          phaseTitle: phase.title,
          decision,
          reviewerNotes: reviewerNotes ?? "",
          portalUrl: "https://www.getzytrion.com/portal",
        });
        await resend.emails.send({
          from: EMAIL_FROM,
          to: profile.contact_email,
          subject: notice.subject,
          html: notice.html,
        });
      }
    }
  } catch (err) {
    console.error("Review decision email failed to send:", err);
  }

  return NextResponse.json({ success: true });
}
