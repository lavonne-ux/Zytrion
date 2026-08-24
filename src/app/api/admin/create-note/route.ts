import { NextRequest, NextResponse } from "next/server";
import { getAdminStatus } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { clientId, noteText, visibleToClient, actionItemDescription, bookingId, kitPhaseId } = await req.json();
  if (!clientId || !noteText) {
    return NextResponse.json({ error: "Missing clientId or noteText." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: note, error: noteError } = await admin
    .from("session_notes")
    .insert({
      client_id: clientId,
      booking_id: bookingId || null,
      kit_phase_id: kitPhaseId || null,
      note_text: noteText,
      visible_to_client: Boolean(visibleToClient),
    })
    .select("id")
    .single();

  if (noteError) {
    return NextResponse.json({ error: "Could not save note.", detail: noteError.message }, { status: 500 });
  }

  if (actionItemDescription) {
    const { error: actionError } = await admin.from("action_items").insert({
      client_id: clientId,
      session_note_id: note.id,
      booking_id: bookingId || null,
      kit_phase_id: kitPhaseId || null,
      description: actionItemDescription,
      status: "open",
    });
    if (actionError) {
      return NextResponse.json({ error: "Note saved, but action item failed.", detail: actionError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
