// src/app/api/tools/generate-pdf-preview/route.ts
//
// Demo-only PDF generation. Renders straight from the request body,
// never reads or writes client_tool_submissions. Nothing persists,
// nothing to clean up afterward. Admin-only: this is for walking a
// client through a tool live or presenting at the keynote, not a
// general "preview before you submit" feature for real clients yet.

import { NextRequest, NextResponse } from "next/server";
import { getAdminStatus } from "@/lib/auth/admin";
import { renderToBuffer } from "@react-pdf/renderer";
import ToolDocumentPdf from "@/lib/pdf/ToolDocumentPdf";

export async function POST(req: NextRequest) {
  const { user, isAdmin } = await getAdminStatus();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: "Preview mode is admin-only." }, { status: 403 });
  }

  const { toolName, fieldSchema, submittedData } = await req.json();
  if (!toolName || !fieldSchema) {
    return NextResponse.json({ error: "Missing toolName or fieldSchema." }, { status: 400 });
  }

  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const buffer = await renderToBuffer(
    ToolDocumentPdf({
      toolName,
      clientName: "Demonstration Preview",
      businessName: "",
      fieldSchema: fieldSchema ?? [],
      submittedData: submittedData ?? {},
      generatedDate,
    })
  );

  const fileName = `${String(toolName).replace(/[^a-zA-Z0-9]/g, "_")}_preview.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      // inline, not attachment: opens straight in a new tab for a live
      // walkthrough instead of triggering a download dialog mid-demo.
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}
