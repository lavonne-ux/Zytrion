import sharp from "sharp";

/**
 * Fetches a client's uploaded logo and re-encodes it into a plain,
 * non-interlaced, 8-bit PNG buffer before it is handed to react-pdf.
 *
 * A logo uploaded through the portal is accepted as-is (see
 * LogoUploadCard.tsx): any real PNG under 2MB in the 300-2000px
 * range passes, including ones exported with 16-bit color depth,
 * interlacing, or an embedded color profile. react-pdf's bundled PDF
 * image decoder cannot read all of those, and when it hits one it
 * doesn't fail loudly on just that image, it fails the whole render,
 * which is what produced a "blank PDF" for a document that otherwise
 * had nothing wrong with it.
 *
 * Re-encoding through sharp first guarantees a baseline image every
 * decoder can read. This never throws: if the source can't be
 * fetched or decoded at all, it returns null and the caller falls
 * back to rendering the document without a logo rather than losing
 * the whole document.
 */
export async function normalizeLogo(
  logoUrl: string | null | undefined
): Promise<Buffer | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const original = Buffer.from(await res.arrayBuffer());
    return await sharp(original)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .png({ progressive: false, compressionLevel: 9 })
      .toBuffer();
  } catch {
    return null;
  }
}
