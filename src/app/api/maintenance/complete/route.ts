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

  const { maintenanceItemId, completionNote, evidencePath, evidenceFileName } = await req.json();
  if (!maintenanceItemId || !completionNote?.trim()) {
    return NextResponse.json({ error: "Missing maintenanceItemId or completionNote." }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("client_maintenance_completions").insert({
    client_id: user.id,
    maintenance_item_id: maintenanceItemId,
    completion_note: completionNote.trim(),
    evidence_path: evidencePath ?? null,
    evidence_file_name: evidenceFileName ?? null,
  });

  if (insertError) {
    return NextResponse.json({ error: "Could not save completion.", detail: insertError.message }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("maintenance_items")
    .select("discipline, log_entry_domain")
    .eq("id", maintenanceItemId)
    .single();

  if (item?.log_entry_domain) {
    const hasEvidence = Boolean(evidencePath);
    const evidenceLevel = hasEvidence ? 2 : 1;

    const { error: logError } = await admin.from("client_log_entries").insert({
      client_id: user.id,
      kit_phase_id: null,
      tool_id: null,
      domain: item.log_entry_domain,
      activity_type: "maintenance_completion",
      claimed_date: new Date().toISOString().split("T")[0],
      finding: `${item.discipline}: ${completionNote.trim()}`,
      outcome: null,
      next_action: null,
      evidence_level: evidenceLevel,
      evidence_artifact_ref: hasEvidence ? { path: evidencePath, fileName: evidenceFileName } : null,
      integrity_flag: false,
      integrity_flag_reason: null,
    });

    if (logError) {
      console.error("Maintenance completion did not propagate to log entries:", logError.message);
    }
  }

  return NextResponse.json({ success: true });
}
