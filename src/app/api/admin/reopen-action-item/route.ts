import { NextRequest, NextResponse } from "next/server";
import { getAdminStatus } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, EMAIL_FROM } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { actionItemId, note } = await req.json();
  if (!actionItemId) {
    return NextResponse.json({ error: "Missing actionItemId." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: item, error } = await admin
    .from("action_items")
    .update({
      status: "open",
      completed_by: null,
      completed_at: null,
    })
    .eq("id", actionItemId)
    .select("client_id, description")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Could not reopen action item.", detail: error.message },
      { status: 500 }
    );
  }

  try {
    if (item) {
      const { data: profile } = await admin
        .from("profiles")
        .select("contact_name, contact_email")
        .eq("id", item.client_id)
        .single();

      const resend = getResendClient();
      if (resend && profile?.contact_email) {
        const noteText = note ? `\n\nNote from your advisor: ${note}` : "";
        await resend.emails.send({
          from: EMAIL_FROM,
          to: profile.contact_email,
          subject: "An action item needs another look",
          html: `<p>Hi ${profile.contact_name || "there"},</p><p>This action item has been reopened and needs more work:</p><p><strong>${item.description}</strong>${noteText}</p><p><a href="https://www.getzytrion.com/portal">View it in your portal</a></p>`,
        });
      }
    }
  } catch (err) {
    console.error("Action item reopen email failed to send:", err);
  }

  return NextResponse.json({ success: true });
}
