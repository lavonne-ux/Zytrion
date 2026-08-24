"use client";
import { useState, useEffect } from "react";
import { localToday } from "@/lib/tools/toolFieldTypes";

type LogEntry = {
  id: string;
  claimed_date: string;
  finding: string;
  evidence_level: number;
  created_at: string;
};

function inferDomain(toolName: string): "decision" | "money" | "responsibility" {
  if (toolName.toLowerCase().includes("financial")) return "money";
  return "decision";
}

export default function ToolLog({
  toolId,
  kitPhaseId,
  toolName,
}: {
  toolId: string;
  kitPhaseId: string;
  toolName: string;
}) {
  const today = localToday();
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [claimedDate, setClaimedDate] = useState(today);
  const [finding, setFinding] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch(`/api/log-entries?kitPhaseId=${kitPhaseId}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setStreakDays(data.streakDays ?? 0);
      });
  }

  useEffect(() => {
    load();
  }, [kitPhaseId]);

  async function handleAdd() {
    if (!finding.trim()) {
      setError("Describe the entry before adding it.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/log-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId,
          kitPhaseId,
          claimedDate,
          finding,
          domain: inferDomain(toolName),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setFinding("");
      setClaimedDate(today);
      load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  if (!entries) {
    return (
      <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
        <p className="text-sm text-zy-chrome">Loading...</p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
      {streakDays > 0 && (
        <div className="mb-4 border border-zy-electric/30 rounded-md p-3 bg-zy-electric/5">
          <p className="text-sm text-zy-electric font-medium">{streakDays}-day streak</p>
        </div>
      )}

      {entries.length > 0 && (
        <div className="mb-4 space-y-2">
          {entries.slice(0, 10).map((entry) => (
            <div key={entry.id} className="border border-white/10 rounded-md p-3 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zy-chrome">
                  {new Date(entry.claimed_date + "T00:00:00").toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-white">{entry.finding}</p>
            </div>
          ))}
          {entries.length > 10 && (
            <p className="text-xs text-zy-chrome/60">+ {entries.length - 10} earlier entries</p>
          )}
        </div>
      )}

      <p className="text-sm text-white font-medium mb-2">Add an entry</p>
      <div className="mb-2">
        <input
          type="date"
          value={claimedDate}
          max={today}
          onChange={(e) => setClaimedDate(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white"
        />
      </div>
      <div className="mb-2">
        <textarea
          value={finding}
          onChange={(e) => setFinding(e.target.value)}
          placeholder="What was decided or reviewed?"
          rows={2}
          className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2.5 text-sm text-white"
        />
      </div>
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      <button
        onClick={handleAdd}
        disabled={saving}
        className="bg-zy-electric hover:bg-zy-royal transition-colors text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
      >
        {saving ? "Saving..." : "Add Entry"}
      </button>
    </div>
  );
}
