"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB, matches the bucket's file_size_limit
const MIN_DIMENSION = 300;
const MAX_DIMENSION = 2000;

type CheckResult = { ok: boolean; message: string; level: "error" | "warning" | "ok" };

function loadImageDimensions(file: File): Promise<{ width: number; height: number; hasTransparency: boolean }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      let hasTransparency = false;
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 250) {
              hasTransparency = true;
              break;
            }
          }
        } catch {
          // Canvas read can fail on some browsers/CORS edge cases; treat as unknown, not a hard failure.
          hasTransparency = true;
        }
      }
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height, hasTransparency });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this file as an image."));
    };
    img.src = url;
  });
}

async function validateLogo(file: File): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  if (file.type !== "image/png") {
    results.push({
      ok: false,
      level: "error",
      message: "This needs to be a PNG file. Other formats (JPG, WEBP, GIF) can't have a transparent background, so the logo would show up as a solid box on your documents instead of blending in.",
    });
    return results;
  }

  if (file.size > MAX_BYTES) {
    results.push({
      ok: false,
      level: "error",
      message: `This file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Keep it under 2MB, logos this small don't need to be large files, and a big one just slows down document generation.`,
    });
    return results;
  }

  try {
    const { width, height, hasTransparency } = await loadImageDimensions(file);

    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      results.push({
        ok: false,
        level: "error",
        message: `This image is ${width}\u00D7${height} pixels. At least ${MIN_DIMENSION}\u00D7${MIN_DIMENSION} keeps it sharp when it prints on a document, smaller than that will look blurry.`,
      });
    } else if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      results.push({
        ok: true,
        level: "warning",
        message: `This image is ${width}\u00D7${height} pixels, larger than it needs to be. It'll still work, but a version closer to 500\u00D7500 pixels would upload faster with no visible difference on the document.`,
      });
    } else {
      results.push({
        ok: true,
        level: "ok",
        message: `${width}\u00D7${height} pixels, a good size for a document header.`,
      });
    }

    if (!hasTransparency) {
      results.push({
        ok: true,
        level: "warning",
        message: "This PNG doesn't appear to have a transparent background. It'll still upload, but it may show up as a solid-colored box on your documents instead of blending into the page. If your logo currently sits on a white or colored square, re-export it with the background removed.",
      });
    } else {
      results.push({
        ok: true,
        level: "ok",
        message: "Transparent background detected, this will blend cleanly into the document header.",
      });
    }
  } catch {
    results.push({
      ok: false,
      level: "error",
      message: "Couldn't read this file's dimensions. Try a different export of the same logo.",
    });
  }

  return results;
}

export default function LogoUploadCard({
  initialLogoUrl,
  userId,
}: {
  initialLogoUrl: string | null;
  userId: string;
}) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const results = await validateLogo(file);
    setChecks(results);

    const hasBlockingError = results.some((r) => r.level === "error");
    if (hasBlockingError) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${userId}/logo.png`;

      const { error: uploadError } = await supabase.storage
        .from("client-logos")
        .upload(path, file, { upsert: true, contentType: "image/png" });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("client-logos").getPublicUrl(path);
      // Cache-bust so a replaced logo shows immediately instead of the old cached image.
      const freshUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ logo_url: freshUrl })
        .eq("id", userId);

      if (profileError) throw profileError;

      setLogoUrl(freshUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed, try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="mb-8 border border-white/10 rounded-lg bg-white/[0.02] px-6 py-5">
      <h2 className="text-lg font-semibold text-white mb-1">Business Logo</h2>
      <p className="text-sm text-zy-chrome mb-4">
        Add your logo and every document your portal generates, resolutions, matrices, policies,
        carries it in the header instead of just your business name in text. This is optional;
        documents look correct either way.
      </p>

      <div className="flex items-start gap-5">
        <div className="w-20 h-20 rounded-md bg-white flex items-center justify-center overflow-hidden border border-white/10 flex-shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Your business logo" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-xs text-zy-chrome/50 text-center px-2">No logo yet</span>
          )}
        </div>

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            onChange={handleFileChange}
            disabled={uploading}
            className="text-sm text-zy-chrome file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-zy-electric/20 file:text-zy-light-blue hover:file:bg-zy-electric/30 file:cursor-pointer"
          />

          {uploading && <p className="text-xs text-zy-light-blue mt-2">Uploading...</p>}

          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

          {checks.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {checks.map((c, i) => (
                <li
                  key={i}
                  className={`text-xs flex items-start gap-1.5 ${
                    c.level === "error" ? "text-red-400" : c.level === "warning" ? "text-yellow-400" : "text-green-400"
                  }`}
                >
                  <span className="mt-0.5">{c.level === "error" ? "\u2715" : c.level === "warning" ? "\u26A0" : "\u2713"}</span>
                  <span>{c.message}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 text-xs text-zy-chrome/60 space-y-0.5">
            <p>PNG only, transparent background, 300 to 2000 pixels on each side, under 2MB.</p>
            <p>Square or wide logos work best in the document header. Tall, narrow logos may look cramped.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
