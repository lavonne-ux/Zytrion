"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDocumentReviewRow({
  reviewId,
  sectionName,
  fileName,
}: {
  reviewId: string;
  sectionName: string;
  fileName: string;
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
          <p className="text-xs text-zy-chrome">{fileName}</p>
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
