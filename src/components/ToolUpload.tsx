"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToolUpload({
  toolId,
  kitPhaseId,
  toolName,
  sections,
}: {
  toolId: string;
  kitPhaseId: string;
  toolName: string;
  sections: string[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState<Record<string, { path: string; fileName: string }[]>>(
    Object.fromEntries(sections.map((s) => [s, []]))
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const allSectionsFilled = sections.every((s) => (files[s]?.length ?? 0) > 0);

  async function handleFileSelect(section: string, file: File) {
    setUploading(section);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sectionName", section);
      formData.append("kitPhaseId", kitPhaseId);

      const res = await fetch("/api/tools/upload-file", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        setUploading(null);
        return;
      }
      setFiles((f) => ({
        ...f,
        [section]: [...(f[section] ?? []), { path: data.path, fileName: data.fileName }],
      }));
    } catch {
      setError("Could not reach the server.");
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit() {
    if (!allSectionsFilled) {
      setError("Every section needs at least one file before this can be submitted.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId,
          kitPhaseId,
          toolName,
          submittedData: { sections: files, retrieval_test_passed: true },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit.");
        setSaving(false);
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="border border-zy-electric rounded-lg p-6 bg-zy-electric/10">
        <p className="text-white font-medium">{toolName} submitted.</p>
        <p className="text-sm text-zy-chrome mt-1">All nine sections confirmed complete. Your advisor will review it shortly.</p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
      <div className="space-y-3 mb-4">
        {sections.map((section) => {
          const sectionFiles = files[section] ?? [];
          const filled = sectionFiles.length > 0;
          return (
            <div
              key={section}
              className={`border rounded-md p-4 ${filled ? "border-zy-electric/40 bg-zy-electric/5" : "border-white/10 bg-white/[0.02]"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white font-medium">{section}</p>
                <span className={`text-xs ${filled ? "text-zy-electric" : "text-zy-chrome/60"}`}>
                  {filled ? `${sectionFiles.length} file(s)` : "Empty"}
                </span>
              </div>
              {sectionFiles.map((f, i) => (
                <p key={i} className="text-xs text-zy-chrome mb-1">{f.fileName}</p>
              ))}
              <label className="inline-block mt-1">
                <span className="text-xs text-zy-light-blue underline cursor-pointer">
                  {uploading === section ? "Uploading..." : "+ Upload a file"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={uploading === section}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(section, file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zy-chrome mb-3">
        {allSectionsFilled
          ? "All nine sections have at least one file."
          : `${sections.filter((s) => (files[s]?.length ?? 0) > 0).length} of ${sections.length} sections filled.`}
      </p>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving || !allSectionsFilled}
        className="bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-6 py-2.5 rounded-md text-sm disabled:opacity-50"
      >
        {saving ? "Submitting..." : `Submit ${toolName}`}
      </button>
    </div>
  );
}
