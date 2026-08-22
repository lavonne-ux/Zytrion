"use client";

import { useState } from "react";

export default function BuyKitButton({
  kitId,
  priceType,
  label,
}: {
  kitId: string;
  priceType: "standard" | "extended";
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create-kit-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitId, priceType }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-6 py-3 rounded-md disabled:opacity-50 text-sm"
      >
        {loading ? "Redirecting..." : label}
      </button>
      {error && <p className="mt-2 text-red-400 text-xs">{error}</p>}
    </div>
  );
}
