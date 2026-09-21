"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDocumentReviewRow({
  reviewId,
  sectionName,
  fileName,
  filePath,
}: {
  reviewId: string;
  sectionName: string;
  fileName: string;
  filePath?: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showRevisionNote, setShowRevisionNote] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");

  async function decide(decision: "approved" | "needs_revision") {
    setSaving(true);
    try {
      await fetch("/api/admin/review-document-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, decision, reviewerNotes: revisionNote || undefined }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-white/10 rounded-md p-3 bg-white/[0.02]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm text-white font-medium">{sectionName}</p>
          {/* The decision is worthless without the document in front of
              you, so the file name is the link to the file itself rather
              than a label describing one you cannot open. */}
          {filePath ? (
            <a
              href={`/api/documents/view?path=${encodeURIComponent(filePath)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zy-light-blue underline hover:text-white"
            >
              {fileName}
            </a>
          ) : (
            <p className="text-xs text-zy-chrome">{fileName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => decide("approved")}
            disabled={saving}
            className="text-xs bg-zy-electric/20 text-zy-electric px-3 py-1.5 rounded-md hover:bg-zy-electric/30 transition-colors disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => setShowRevisionNote((s) => !s)}
            disabled={saving}
            className="text-xs bg-white/5 text-zy-chrome px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Needs Revision
          </button>
        </div>
      </div>
      {showRevisionNote && (
        <div className="mt-2">
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="What needs to change in this section?"
            rows={2}
            className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white mb-2"
          />
          <button
            onClick={() => decide("needs_revision")}
            disabled={saving}
            className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-md hover:bg-amber-500/30 transition-colors disabled:opacity-50"
          >
            Send Back for Revision
          </button>
        </div>
      )}
    </div>
  );
}
