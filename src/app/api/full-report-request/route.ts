import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { assessmentId } = await req.json();

  if (!assessmentId) {
    return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("assessments")
    .update({ full_report_requested_at: new Date().toISOString() })
    .eq("id", assessmentId);

  if (error) {
    return NextResponse.json({ error: "Could not save request", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
