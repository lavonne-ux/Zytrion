import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, EMAIL_FROM, FOUNDER_EMAIL } from "@/lib/email/resend";
import { phaseSubmittedForReviewEmail } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { kitPhaseId, status, evidenceNote } = await req.json();
  if (!kitPhaseId || !["not_started", "in_progress", "complete"].includes(status)) {
    return NextResponse.json({ error: "Missing or invalid kitPhaseId/status." }, { status: 400 });
  }

  if (status === "complete" && (!evidenceNote || !evidenceNote.trim())) {
    return NextResponse.json(
      { error: "Describe what you completed before marking this phase done." },
      { status: 400 }
    );
  }

  const { error: progressError } = await supabase.from("client_phase_progress").upsert(
    {
      client_id: user.id,
      kit_phase_id: kitPhaseId,
      status,
      completed_at: status === "complete" ? new Date().toISOString() : null,
      evidence_artifact_ref:
        status === "complete"
          ? { note: evidenceNote.trim(), submitted_at: new Date().toISOString() }
          : null,
      // Every real submission, first time or resubmission after a
      // revision request, resets review status back to pending, so
      // it always lands back in the queue rather than staying stuck
      // on whatever decision was made last time.
      review_status: status === "complete" ? "pending" : "pending",
    },
    { onConflict: "client_id,kit_phase_id" }
  );

  if (progressError) {
    return NextResponse.json(
      { error: "Could not save progress.", detail: progressError.message },
      { status: 500 }
    );
  }

  if (status === "complete") {
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
        .eq("client_id", user.id)
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
          .eq("id", user.id)
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
  }

  return NextResponse.json({ success: true });
}
