import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const sectionName = formData.get("sectionName") as string | null;
  const kitPhaseId = formData.get("kitPhaseId") as string | null;

  if (!file || !sectionName || !kitPhaseId) {
    return NextResponse.json({ error: "Missing file, sectionName, or kitPhaseId." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed. Use PDF, DOCX, JPG, or PNG." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large. 25MB maximum." }, { status: 400 });
  }

  // Path always starts with the uploader's own id, matching the
  // storage policy that restricts each client to their own folder.
  const safeSection = sectionName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `${user.id}/${kitPhaseId}/${safeSection}/${Date.now()}_${file.name}`;

  const { error } = await supabase.storage.from("client-documents").upload(path, file);

  if (error) {
    return NextResponse.json({ error: "Upload failed.", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, path, fileName: file.name });
}
