import { NextRequest, NextResponse } from "next/server";
import { getAdminStatus } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { progressId, decision, reviewerNotes } = await req.json();
  if (!progressId || !["approved", "needs_revision"].includes(decision)) {
    return NextResponse.json({ error: "Missing or invalid progressId/decision." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("client_phase_progress")
    .update({
      review_status: decision,
      reviewer_notes: reviewerNotes ?? null,
    })
    .eq("id", progressId);

  if (error) {
    return NextResponse.json(
      { error: "Could not save review.", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
