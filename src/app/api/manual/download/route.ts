import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// The real bucket name, exactly as it exists in Supabase, including
// the .pdf suffix that ended up baked into the bucket name itself.
const MANUAL_BUCKET = "manual-pdfs-zytrion-manual-current.pdf";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();

  // The real gate. Being logged in is not enough, a completed payment
  // record for this exact product has to exist for this exact client.
  const { data: purchase } = await admin
    .from("payments")
    .select("id")
    .eq("client_id", user.id)
    .eq("product", "Zytrion Enterprise in Motion Manual")
    .eq("status", "succeeded")
    .limit(1)
    .maybeSingle();

  if (!purchase) {
    return NextResponse.json(
      { error: "No confirmed Manual purchase found for this account." },
      { status: 403 }
    );
  }

  // Never hardcode a filename here. Whatever single file is actually
  // sitting in the bucket right now is what gets served, so revising
  // the manual only ever means replacing that file, this route never
  // needs to change.
  const { data: files, error: listError } = await admin.storage
    .from(MANUAL_BUCKET)
    .list("", { limit: 1, sortBy: { column: "created_at", order: "desc" } });

  if (listError || !files || files.length === 0) {
    console.error("Manual download: bucket list failed or empty.", listError?.message);
    return NextResponse.json(
      { error: "The Manual file could not be found. Contact support." },
      { status: 500 }
    );
  }

  const fileName = files[0].name;

  const { data: signedUrlData, error: signError } = await admin.storage
    .from(MANUAL_BUCKET)
    .createSignedUrl(fileName, 300);

  if (signError || !signedUrlData) {
    console.error("Manual download: signed URL generation failed.", signError?.message);
    return NextResponse.json(
      { error: "Could not generate a download link. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signedUrlData.signedUrl);
}
