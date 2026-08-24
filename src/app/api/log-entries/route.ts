import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function computeStreak(claimedDates: string[]): number {
  const uniqueDates = Array.from(new Set(claimedDates)).sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  let streak = 0;

  for (const dateStr of uniqueDates) {
    const entryDate = new Date(dateStr + "T00:00:00");
    const diffDays = Math.round((cursor.getTime() - entryDate.getTime()) / 86400000);
    if (diffDays === 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (diffDays === 1 && streak === 0) {
      streak++;
      cursor = new Date(entryDate);
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const kitPhaseId = req.nextUrl.searchParams.get("kitPhaseId");
  if (!kitPhaseId) {
    return NextResponse.json({ error: "Missing kitPhaseId." }, { status: 400 });
  }

  const { data: entries, error } = await supabase
    .from("client_log_entries")
    .select("id, claimed_date, finding, evidence_level, created_at")
    .eq("client_id", user.id)
    .eq("kit_phase_id", kitPhaseId)
    .order("claimed_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load entries.", detail: error.message }, { status: 500 });
  }

  const streakDays = computeStreak((entries ?? []).map((e) => e.claimed_date));

  return NextResponse.json({ entries: entries ?? [], streakDays });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { toolId, kitPhaseId, claimedDate, finding, domain } = await req.json();
  if (!kitPhaseId || !claimedDate || !finding?.trim()) {
    return NextResponse.json({ error: "Missing kitPhaseId, claimedDate, or finding." }, { status: 400 });
  }

  const { error } = await supabase.from("client_log_entries").insert({
    client_id: user.id,
    kit_phase_id: kitPhaseId,
    tool_id: toolId ?? null,
    domain: domain ?? "decision",
    activity_type: "manual_log_entry",
    claimed_date: claimedDate,
    finding: finding.trim(),
    outcome: null,
    next_action: null,
    evidence_level: 1,
    evidence_artifact_ref: null,
    integrity_flag: false,
    integrity_flag_reason: null,
  });

  if (error) {
    return NextResponse.json({ error: "Could not save entry.", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
