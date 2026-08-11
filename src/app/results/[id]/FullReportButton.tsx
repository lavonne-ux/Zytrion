"use client";

import { useState } from "react";

export default function FullReportButton({ assessmentId }: { assessmentId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleClick() {
    setStatus("sending");
    try {
      const res = await fetch("/api/full-report-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <span className="inline-flex items-center justify-center rounded-lg border border-zy-electric px-5 py-3 text-sm font-medium text-zy-electric">
        Request received, we will follow up by email
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === "sending"}
      className="inline-flex items-center justify-center rounded-lg border border-zy-electric px-5 py-3 text-sm font-medium text-white hover:bg-zy-electric/10 transition disabled:opacity-60"
    >
      {status === "sending" ? "Sending..." : status === "error" ? "Try again" : "Get Your Full Report"}
    </button>
  );
}
