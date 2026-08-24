import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { actionItemId } = await req.json();
  if (!actionItemId) {
    return NextResponse.json({ error: "Missing action item." }, { status: 400 });
  }

  // Ownership check: a client can only complete their own action item,
  // never one belonging to someone else, regardless of what ID is sent.
  const { data: item } = await supabase
    .from("action_items")
    .select("id, client_id, description, status")
    .eq("id", actionItemId)
    .eq("client_id", user.id)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Action item not found." }, { status: 404 });
  }
  if (item.status === "complete") {
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("action_items")
    .update({
      status: "complete",
      completed_by: "client",
      completed_at: new Date().toISOString(),
    })
    .eq("id", actionItemId);

  if (error) {
    return NextResponse.json({ error: "Could not update action item." }, { status: 500 });
  }

  const clientName = (user.user_metadata as any)?.contact_name ?? user.email ?? "A client";
  try {
    await resend.emails.send({
      from: "Zytrion Infrastructure Group <info@getzytrion.com>",
      to: "info@getzytrion.com",
      subject: "Action item marked complete",
      text: `${clientName} marked this action item complete:\n\n"${item.description}"`,
    });
  } catch {
    // Never block the status update on an email failure.
  }

  return NextResponse.json({ success: true });
}
