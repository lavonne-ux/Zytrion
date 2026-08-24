import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("client_quarterly_reviews")
    .select("*")
    .eq("client_id", user.id)
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load reviews.", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const { reviewQuarter, decisionFlowNotes, moneyFlowNotes, responsibilityFlowNotes, driftIdentified, correctiveAction } = body;

  if (!reviewQuarter) {
    return NextResponse.json({ error: "Missing reviewQuarter." }, { status: 400 });
  }
  if (driftIdentified && !correctiveAction?.trim()) {
    return NextResponse.json({ error: "Corrective action is required when drift is identified." }, { status: 400 });
  }

  const { error } = await supabase.from("client_quarterly_reviews").insert({
    client_id: user.id,
    review_quarter: reviewQuarter,
    decision_flow_notes: decisionFlowNotes ?? null,
    money_flow_notes: moneyFlowNotes ?? null,
    responsibility_flow_notes: responsibilityFlowNotes ?? null,
    drift_identified: Boolean(driftIdentified),
    corrective_action: driftIdentified ? correctiveAction : null,
  });

  if (error) {
    return NextResponse.json({ error: "Could not save review.", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
