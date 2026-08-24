import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completePhase } from "@/lib/portal/completePhase";

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

  const { toolId, kitPhaseId, toolName, submittedData, autoApprove, createSectionReviews } = await req.json();
  if (!toolId || !kitPhaseId || !submittedData) {
    return NextResponse.json({ error: "Missing toolId, kitPhaseId, or submittedData." }, { status: 400 });
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

  // Forms and worksheets: completeness is the gate, not a human review.
  // Governance Binder: phase-level status still tracks as pending until
  // every individual section above is approved.
  const result = await completePhase({
    userId: user.id,
    kitPhaseId,
    evidenceNote: summarize(toolName ?? "Tool", submittedData),
    reviewStatus: autoApprove ? "approved" : "pending",
  });

  if (!result.success) {
    return NextResponse.json({ error: "Saved, but could not update phase status.", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
