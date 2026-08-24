import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import ToolDocumentPdf from "@/lib/pdf/ToolDocumentPdf";

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

  const { data: submission, error: submissionError } = await supabase
    .from("client_tool_submissions")
    .select("submitted_data, tool_id")
    .eq("client_id", user.id)
    .eq("kit_phase_id", kitPhaseId)
    .single();

  if (submissionError || !submission) {
    return NextResponse.json({ error: "No submission found for this phase." }, { status: 404 });
  }

  const { data: tool } = await supabase
    .from("tools")
    .select("tool_name, field_schema")
    .eq("id", submission.tool_id)
    .single();

  if (!tool) {
    return NextResponse.json({ error: "Tool not found." }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("contact_name, business_name")
    .eq("id", user.id)
    .single();

  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const buffer = await renderToBuffer(
    ToolDocumentPdf({
      toolName: tool.tool_name,
      clientName: profile?.contact_name ?? "Client",
      businessName: profile?.business_name ?? "",
      fieldSchema: tool.field_schema ?? [],
      submittedData: submission.submitted_data ?? {},
      generatedDate,
    })
  );

  const fileName = `${tool.tool_name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
