"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewDecisionButtons({ progressId }: { progressId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approved" | "needs_revision") {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/review-phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressId, decision, reviewerNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save review.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional note back to the client"
        rows={2}
        className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-sm text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric mb-2"
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => decide("approved")}
          disabled={loading}
          className="text-sm bg-zy-electric hover:bg-zy-royal transition-colors text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? "Saving..." : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => decide("needs_revision")}
          disabled={loading}
          className="text-sm border border-white/20 text-white px-4 py-2 rounded-md hover:border-white/40 transition-colors disabled:opacity-50"
        >
          Needs Revision
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
