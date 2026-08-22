import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { error } = await supabase.from("client_phase_progress").upsert(
    {
      client_id: user.id,
      kit_phase_id: kitPhaseId,
      status,
      completed_at: status === "complete" ? new Date().toISOString() : null,
    },
    { onConflict: "client_id,kit_phase_id" }
  );

  if (error) {
    return NextResponse.json(
      { error: "Could not save progress.", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
