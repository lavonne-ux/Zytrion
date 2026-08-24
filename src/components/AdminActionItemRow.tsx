"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminActionItemRow({
  actionItemId,
  description,
  status,
}: {
  actionItemId: string;
  description: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reopen() {
    setLoading(true);
    try {
      await fetch("/api/admin/reopen-action-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionItemId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <p className={`text-sm ${status === "complete" ? "text-zy-chrome/60 line-through" : "text-white"}`}>
        {description}
      </p>
      {status === "complete" && (
        <button
          onClick={reopen}
          disabled={loading}
          className="text-xs text-zy-light-blue underline hover:text-white flex-shrink-0 ml-4"
        >
          {loading ? "..." : "Reopen"}
        </button>
      )}
    </div>
  );
}
