import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completePhase } from "@/lib/portal/completePhase";

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

  if (status !== "complete") {
    const { error: progressError } = await supabase.from("client_phase_progress").upsert(
      {
        client_id: user.id,
        kit_phase_id: kitPhaseId,
        status,
        completed_at: null,
        evidence_artifact_ref: null,
        review_status: "pending",
      },
      { onConflict: "client_id,kit_phase_id" }
    );
    if (progressError) {
      return NextResponse.json(
        { error: "Could not save progress.", detail: progressError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  }

  const result = await completePhase({
    userId: user.id,
    kitPhaseId,
    evidenceNote,
  });

  if (!result.success) {
    return NextResponse.json({ error: "Could not save progress.", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
