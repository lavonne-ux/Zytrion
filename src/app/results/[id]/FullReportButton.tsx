"use client";

import { useState } from "react";

export default function FullReportButton({
  assessmentId,
  alreadyPaid,
}: {
  assessmentId: string;
  alreadyPaid?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error();
      window.location.href = data.url;
    } catch {
      setError(true);
      setLoading(false);
    }
  }

  if (alreadyPaid) {
    return (
      <span className="inline-flex items-center justify-center rounded-lg border border-zy-electric px-5 py-3 text-sm font-medium text-zy-electric">
        Full Report Unlocked
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-lg border border-zy-electric px-5 py-3 text-sm font-medium text-white hover:bg-zy-electric/10 transition disabled:opacity-60"
    >
      {loading ? "Redirecting to checkout..." : error ? "Try again" : "Get Your Full Report — $497"}
    </button>
  );
}
