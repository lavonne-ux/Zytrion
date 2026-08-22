"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PhaseProgressButton({
  kitPhaseId,
  status,
}: {
  kitPhaseId: string;
  status: "not_started" | "in_progress" | "complete";
}) {
  const router = useRouter();
  const [localStatus, setLocalStatus] = useState(status);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  async function updateStatus(newStatus: "in_progress" | "complete") {
    setError(null);
    if (newStatus === "complete" && !note.trim()) {
      setError("Describe what you completed before marking this phase done.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/portal/update-phase-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitPhaseId, status: newStatus, evidenceNote: note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update. Try again.");
        setLoading(false);
        return;
      }
      setLocalStatus(newStatus);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
  }

  if (localStatus === "complete") {
    return <p className="text-sm text-zy-electric font-medium">Complete</p>;
  }

  return (
    <div>
      {localStatus === "not_started" && (
        <button
          type="button"
          onClick={() => updateStatus("in_progress")}
          disabled={loading}
          className="text-sm border border-white/20 text-white px-4 py-2 rounded-md hover:border-white/40 transition-colors disabled:opacity-50"
        >
          {loading ? "Starting..." : "Start This Phase"}
        </button>
      )}
      {localStatus === "in_progress" && (
        <div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you complete? A link, a location, or a short description."
            rows={2}
            className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-sm text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric mb-2"
          />
          <button
            type="button"
            onClick={() => updateStatus("complete")}
            disabled={loading}
            className="text-sm bg-zy-electric hover:bg-zy-royal transition-colors text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? "Saving..." : "Mark Complete"}
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
