import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { kitPhaseId, status } = await req.json();
  if (!kitPhaseId || !["not_started", "in_progress", "complete"].includes(status)) {
    return NextResponse.json({ error: "Missing or invalid kitPhaseId/status." }, { status: 400 });
  }

  const { error: progressError } = await supabase.from("client_phase_progress").upsert(
    {
      client_id: user.id,
      kit_phase_id: kitPhaseId,
      status,
      completed_at: status === "complete" ? new Date().toISOString() : null,
    },
    { onConflict: "client_id,kit_phase_id" }
  );

  if (progressError) {
    return NextResponse.json(
      { error: "Could not save progress.", detail: progressError.message },
      { status: 500 }
    );
  }

  // Advancing the enrollment's overall phase is a separate concern from
  // logging this one phase's status, and only matters when a phase is
  // actually completed. Uses the admin client since the values written
  // here are server-computed from real phase counts, not client input.
  if (status === "complete") {
    const admin = createAdminClient();

    const { data: phase } = await admin
      .from("kit_phases")
      .select("phase_number, kit_id")
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
    }
  }

  return NextResponse.json({ success: true });
}
