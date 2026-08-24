import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getResendClient, EMAIL_FROM, FOUNDER_EMAIL } from "@/lib/email/resend";
import { phaseSubmittedForReviewEmail } from "@/lib/email/templates";

// Shared by both the simple note-based phase completion route and the
// real tool-form submission route, so there is exactly one
// "mark this phase complete" implementation, not two that could
// quietly drift apart from each other over time.
export async function completePhase(params: {
  userId: string;
  kitPhaseId: string;
  evidenceNote: string;
  reviewStatus?: "pending" | "approved";
}) {
  const { userId, kitPhaseId, evidenceNote, reviewStatus = "pending" } = params;
  const supabase = await createClient();

  const { error: progressError } = await supabase.from("client_phase_progress").upsert(
    {
      client_id: userId,
      kit_phase_id: kitPhaseId,
      status: "complete",
      completed_at: new Date().toISOString(),
      evidence_artifact_ref: { note: evidenceNote.trim(), submitted_at: new Date().toISOString() },
      review_status: reviewStatus,
    },
    { onConflict: "client_id,kit_phase_id" }
  );

  if (progressError) {
    return { success: false, error: progressError.message };
  }

  const admin = createAdminClient();

  const { data: phase } = await admin
    .from("kit_phases")
    .select("phase_number, kit_id, title, kits ( title )")
    .eq("id", kitPhaseId)
    .single();

  if (phase) {
    const { count: totalPhases } = await admin
      .from("kit_phases")
      .select("id", { count: "exact", head: true })
      .eq("kit_id", phase.kit_id);

    const isLastPhase = totalPhases != null && phase.phase_number >= totalPhases;

    const { data: enrollment } = await admin
      .from("client_kit_enrollments")
      .select("id, current_phase")
      .eq("client_id", userId)
      .eq("kit_id", phase.kit_id)
      .single();

    if (enrollment) {
      const nextPhase = Math.max(enrollment.current_phase ?? 1, phase.phase_number + 1);
      const { error: enrollError } = await admin
        .from("client_kit_enrollments")
        .update({
          current_phase: isLastPhase ? phase.phase_number : nextPhase,
          status: isLastPhase ? "complete" : "active",
        })
        .eq("id", enrollment.id);

      if (enrollError) {
        console.error("Enrollment phase advance failed:", enrollError.message);
      }
    }

    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("contact_name, contact_email")
        .eq("id", userId)
        .single();

      const resend = getResendClient();
      if (resend && profile?.contact_email) {
        const notice = phaseSubmittedForReviewEmail({
          contactName: profile.contact_name || "A client",
          contactEmail: profile.contact_email,
          kitTitle: (phase as any).kits?.title ?? "Kit",
          phaseTitle: phase.title,
          phaseNumber: phase.phase_number,
          evidenceNote: evidenceNote.trim(),
          adminUrl: "https://www.getzytrion.com/admin",
        });
        await resend.emails.send({
          from: EMAIL_FROM,
          to: FOUNDER_EMAIL,
          subject: notice.subject,
          html: notice.html,
        });
      }
    } catch (err) {
      console.error("Phase submission alert failed to send:", err);
    }
  }

  return { success: true };
}
