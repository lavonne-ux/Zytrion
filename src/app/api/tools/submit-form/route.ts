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

  const { toolId, kitPhaseId, toolName, submittedData } = await req.json();
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

  const result = await completePhase({
    userId: user.id,
    kitPhaseId,
    evidenceNote: summarize(toolName ?? "Tool", submittedData),
  });

  if (!result.success) {
    return NextResponse.json({ error: "Saved, but could not update phase status.", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
