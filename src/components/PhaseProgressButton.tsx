"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PhaseProgressButton({
  kitPhaseId,
  status,
}: {
  kitPhaseId: string;
  status: "not_started" | "in_progress" | "complete";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(newStatus: "in_progress" | "complete") {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portal/update-phase-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitPhaseId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update. Try again.");
        setLoading(false);
        return;
      }
      router.refresh();
      setLoading(false);
    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
  }

  if (status === "complete") {
    return <p className="text-sm text-zy-electric font-medium">Complete</p>;
  }

  return (
    <div>
      {status === "not_started" && (
        <button
          type="button"
          onClick={() => updateStatus("in_progress")}
          disabled={loading}
          className="text-sm border border-white/20 text-white px-4 py-2 rounded-md hover:border-white/40 transition-colors disabled:opacity-50"
        >
          {loading ? "Starting..." : "Start This Phase"}
        </button>
      )}
      {status === "in_progress" && (
        <button
          type="button"
          onClick={() => updateStatus("complete")}
          disabled={loading}
          className="text-sm bg-zy-electric hover:bg-zy-royal transition-colors text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? "Saving..." : "Mark Complete"}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
