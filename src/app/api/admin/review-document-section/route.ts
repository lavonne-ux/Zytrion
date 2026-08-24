import { NextRequest, NextResponse } from "next/server";
import { getAdminStatus } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, EMAIL_FROM, FOUNDER_EMAIL } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { reviewId, decision, reviewerNotes } = await req.json();
  if (!reviewId || !["approved", "needs_revision"].includes(decision)) {
    return NextResponse.json({ error: "Missing reviewId or invalid decision." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: review, error: fetchError } = await admin
    .from("client_document_reviews")
    .select("client_id, kit_phase_id, section_name")
    .eq("id", reviewId)
    .single();

  if (fetchError || !review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  const { error: updateError } = await admin
    .from("client_document_reviews")
    .update({
      review_status: decision,
      reviewer_notes: reviewerNotes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (updateError) {
    return NextResponse.json({ error: "Could not save decision.", detail: updateError.message }, { status: 500 });
  }

  // Once every section for this client's binder is approved, the
  // phase itself can clear from the general review queue too. Until
  // then it stays pending, reflecting that real work is still open.
  const { data: allSections } = await admin
    .from("client_document_reviews")
    .select("review_status")
    .eq("client_id", review.client_id)
    .eq("kit_phase_id", review.kit_phase_id);

  const allApproved = allSections != null && allSections.length > 0 && allSections.every((s) => s.review_status === "approved");

  if (allApproved) {
    await admin
      .from("client_phase_progress")
      .update({ review_status: "approved" })
      .eq("client_id", review.client_id)
      .eq("kit_phase_id", review.kit_phase_id);
  }

  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("contact_name, contact_email")
      .eq("id", review.client_id)
      .single();

    const resend = getResendClient();
    if (resend && profile?.contact_email) {
      const subject =
        decision === "approved"
          ? `${review.section_name} approved`
          : `${review.section_name} needs another look`;
      const body =
        decision === "approved"
          ? `<p>Your ${review.section_name} section has been approved.</p>`
          : `<p>Your ${review.section_name} section needs revision.</p>${reviewerNotes ? `<p>${reviewerNotes}</p>` : ""}`;
      await resend.emails.send({
        from: EMAIL_FROM,
        to: profile.contact_email,
        subject,
        html: body,
      });
    }
  } catch (err) {
    console.error("Document review notification failed to send:", err);
  }

  return NextResponse.json({ success: true, allApproved });
}
