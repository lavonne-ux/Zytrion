import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

  const { data: profile } = await admin
    .from("profiles")
    .select("contact_name, contact_email")
    .eq("id", user.id)
    .single();

  // Never hardcode a filename here. Whatever real PDF is sitting in the
  // bucket right now is what gets served, so revising the manual only
  // ever means uploading a new file, this route never needs to change.
  // The .pdf filter skips the empty-folder placeholder object Supabase
  // leaves behind after a bucket is emptied and refilled.
  const { data: files, error: listError } = await admin.storage
    .from(MANUAL_BUCKET)
    .list("", { limit: 5, sortBy: { column: "created_at", order: "desc" } });

  const fileEntry = files?.find((f) => f.name.toLowerCase().endsWith(".pdf"));

  if (listError || !fileEntry) {
    console.error("Manual download: bucket list failed or empty.", listError?.message);
    return NextResponse.json(
      { error: "The Manual file could not be found. Contact support." },
      { status: 500 }
    );
  }

  const { data: fileBlob, error: downloadError } = await admin.storage
    .from(MANUAL_BUCKET)
    .download(fileEntry.name);

  if (downloadError || !fileBlob) {
    console.error("Manual download: file download failed.", downloadError?.message);
    return NextResponse.json(
      { error: "Could not retrieve the Manual file. Try again." },
      { status: 500 }
    );
  }

  const sourceBytes = new Uint8Array(await fileBlob.arrayBuffer());

  // Security note, stated plainly rather than implied: this is a
  // deterrent, not DRM. The file remains an ordinary, fully readable
  // PDF for its rightful buyer. What this adds is that a shared copy
  // is traceable back to exactly who it was issued to and when, which
  // is the realistic protection for a document sold like this one, a
  // hard lock would also block the paying buyer from opening it
  // normally. If watermarking fails for any reason, the unwatermarked
  // file is still served rather than blocking a paying customer's
  // download, but the failure is logged so it does not fail silently.
  let outputBytes: Uint8Array = sourceBytes;
  try {
    const pdfDoc = await PDFDocument.load(sourceBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const stampText = `Licensed to ${profile?.contact_name || "Unknown"} (${profile?.contact_email || user.email}) — downloaded ${new Date().toLocaleDateString(
      "en-US"
    )} — not for redistribution`;
    const fontSize = 7;

    for (const page of pdfDoc.getPages()) {
      const { width } = page.getSize();
      const textWidth = font.widthOfTextAtSize(stampText, fontSize);
      page.drawText(stampText, {
        x: Math.max((width - textWidth) / 2, 18),
        y: 18,
        size: fontSize,
        font,
        color: rgb(0.55, 0.55, 0.55),
        opacity: 0.65,
      });
    }

    outputBytes = await pdfDoc.save();
  } catch (err) {
    console.error("Manual download: watermarking failed, serving the unwatermarked file.", err);
  }

  return new NextResponse(Buffer.from(outputBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Zytrion_Enterprise_in_Motion_Manual.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
