import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completePhase } from "@/lib/portal/completePhase";
import { flagSubmission, shouldAutoApprove } from "@/lib/tools/reviewFlags";
import { checkPhaseAccess } from "@/lib/portal/phaseAccess";

function summarize(toolName: string, data: Record<string, any>): string {
  const parts = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
  return `${toolName} submitted. ${parts.join(", ")}`.slice(0, 500);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // autoApprove is deliberately not read from the request any more. It used
  // to arrive from the browser and was written straight into the review
  // status, which meant a client decided whether their own work needed
  // reviewing. The decision is made below, on the server, from the content
  // of the submission itself.
  const { toolId, kitPhaseId, toolName, submittedData, createSectionReviews } = await req.json();
  if (!toolId || !kitPhaseId || !submittedData) {
    return NextResponse.json({ error: "Missing toolId, kitPhaseId, or submittedData." }, { status: 400 });
  }

  // Enrollment and phase order are checked before anything is written. This
  // runs first deliberately: a refused submission should leave no trace at
  // all, not a saved tool submission attached to a phase the client was
  // never entitled to open.
  const access = await checkPhaseAccess(user.id, kitPhaseId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { error: submissionError } = await supabase.from("client_tool_submissions").upsert(
    {
      client_id: user.id,
      kit_phase_id: kitPhaseId,
      tool_id: toolId,
      submitted_data: submittedData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "client_id,kit_phase_id" }
  );

  if (submissionError) {
    return NextResponse.json(
      { error: "Could not save your submission.", detail: submissionError.message },
      { status: 500 }
    );
  }

  // Governance Binder and any future multi-document upload tool: each
  // section gets its own review row, not one bulk phase-level decision,
  // so a problem in one section never forces a redo of the other eight.
  if (createSectionReviews && submittedData?.sections) {
    const sectionEntries = Object.entries(submittedData.sections) as [
      string,
      { path: string; fileName: string }[]
    ][];
    for (const [sectionName, files] of sectionEntries) {
      if (!files || files.length === 0) continue;
      const latestFile = files[files.length - 1];
      const { error: reviewError } = await supabase.from("client_document_reviews").upsert(
        {
          client_id: user.id,
          kit_phase_id: kitPhaseId,
          section_name: sectionName,
          file_path: latestFile.path,
          file_name: latestFile.fileName,
          review_status: "pending",
          reviewed_at: null,
        },
        { onConflict: "client_id,kit_phase_id,section_name" }
      );
      if (reviewError) {
        console.error(`Document review row failed for section ${sectionName}:`, reviewError.message);
      }
    }
  }

  // Automatic triage. A submission that trips none of the documented
  // failure patterns is approved on the spot, so a reviewer's time is spent
  // only on work that actually needs a person. Anything flagged goes to the
  // review queue carrying the reasons, so the reviewer opens it already
  // knowing what to look at.
  const flags = flagSubmission({ toolName: toolName ?? "Tool", submittedData });

  // One exception, and it matters. Once a human has sent a phase back, every
  // later submission on that phase returns to that human, whatever the
  // automatic checks say. A reviewer may have sent it back for a reason no
  // pattern can detect, and a client should not be able to clear a human
  // judgement by fixing something mechanical.
  const { data: priorProgress } = await supabase
    .from("client_phase_progress")
    .select("review_status")
    .eq("client_id", user.id)
    .eq("kit_phase_id", kitPhaseId)
    .maybeSingle();

  const wasSentBack = priorProgress?.review_status === "needs_revision";
  const autoApproved = shouldAutoApprove(flags) && !wasSentBack;

  const result = await completePhase({
    userId: user.id,
    kitPhaseId,
    evidenceNote: summarize(toolName ?? "Tool", submittedData),
    reviewStatus: autoApproved ? "approved" : "pending",
    reviewFlags: flags,
  });

  if (!result.success) {
    return NextResponse.json({ error: "Saved, but could not update phase status.", detail: result.error }, { status: 500 });
  }

  // The client is told plainly which way it went, so the screen can stop
  // promising a review that is not going to happen.
  return NextResponse.json({
    success: true,
    autoApproved,
    flagCount: flags.length,
  });
}
