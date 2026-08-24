"use client";
import { useState } from "react";

export default function ActionItemCheckbox({
  actionItemId,
  description,
  initialStatus,
}: {
  actionItemId: string;
  description: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markComplete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/action-items/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionItemId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not update this item.");
        setLoading(false);
        return;
      }
      setStatus("complete");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <button
        onClick={markComplete}
        disabled={status === "complete" || loading}
        aria-label={status === "complete" ? "Completed" : "Mark complete"}
        className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${
          status === "complete"
            ? "bg-zy-electric border-zy-electric"
            : "border-white/30 hover:border-zy-electric"
        }`}
      >
        {status === "complete" && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div>
        <p className={`text-sm ${status === "complete" ? "text-zy-chrome/60 line-through" : "text-white"}`}>
          {description}
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    </div>
  );
}
