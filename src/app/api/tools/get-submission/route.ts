import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data, error } = await supabase
    .from("client_tool_submissions")
    .select("submitted_data")
    .eq("client_id", user.id)
    .eq("kit_phase_id", kitPhaseId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not load submission.", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ submittedData: data?.submitted_data ?? null });
}
