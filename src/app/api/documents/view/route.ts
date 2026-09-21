import { NextRequest, NextResponse } from "next/server";
import { getAdminStatus } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const DOCUMENTS_BUCKET = "client-documents";

// Opens a client-uploaded governance document.
//
// Until this route existed, client-documents was write-only across the
// whole platform: files uploaded fine and nothing could ever read them
// back. That left the admin document review screen asking for an approve
// or reject decision on files nobody could open, and left clients with no
// way to retrieve their own evidence once it was submitted.
//
// Two rules decide access, and both are enforced here rather than trusted
// from the caller. Upload writes every object under the uploader's own id
// as the first path segment, so a client may open a path that begins with
// their id and nothing else. An admin may open any path, because reviewing
// submitted evidence is the job. The signed link is deliberately short
// lived and minted per request, so a URL that leaks from a browser history
// or a shared screen stops working within the minute.
export async function GET(req: NextRequest) {
  const { user, isAdmin } = await getAdminStatus();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path." }, { status: 400 });
  }

  // Refuse anything that tries to climb out of its own folder before the
  // ownership check runs, so a crafted path cannot reach another client's
  // documents by traversal.
  if (path.includes("..")) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  const ownsFile = path.startsWith(`${user.id}/`);

  if (!ownsFile && !isAdmin) {
    return NextResponse.json(
      { error: "You do not have access to this document." },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    console.error("Document view: could not sign", path, error?.message);
    return NextResponse.json(
      { error: "Could not open that document. It may have been removed." },
      { status: 404 }
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
