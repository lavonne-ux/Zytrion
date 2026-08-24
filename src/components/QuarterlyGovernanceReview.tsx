"use client";
import { useState, useEffect } from "react";

type Review = {
  id: string;
  review_quarter: string;
  decision_flow_notes: string | null;
  money_flow_notes: string | null;
  responsibility_flow_notes: string | null;
  drift_identified: boolean;
  corrective_action: string | null;
  submitted_at: string;
};

function currentQuarterLabel(): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `Q${q} ${now.getFullYear()}`;
}

export default function QuarterlyGovernanceReview() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [reviewQuarter, setReviewQuarter] = useState(currentQuarterLabel());
  const [decisionNotes, setDecisionNotes] = useState("");
  const [moneyNotes, setMoneyNotes] = useState("");
  const [responsibilityNotes, setResponsibilityNotes] = useState("");
  const [driftIdentified, setDriftIdentified] = useState(false);
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/quarterly-review")
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit() {
    if (driftIdentified && !correctiveAction.trim()) {
      setError("Corrective action is required when drift is identified.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/quarterly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewQuarter,
          decisionFlowNotes: decisionNotes,
          moneyFlowNotes: moneyNotes,
          responsibilityFlowNotes: responsibilityNotes,
          driftIdentified,
          correctiveAction,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not save.");
        return;
      }
      setDecisionNotes("");
      setMoneyNotes("");
      setResponsibilityNotes("");
      setDriftIdentified(false);
      setCorrectiveAction("");
      setExpanded(false);
      load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  if (!reviews) {
    return <p className="text-sm text-zy-chrome">Loading...</p>;
  }

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white font-semibold">Quarterly Governance Review</p>
        <button onClick={() => setExpanded((e) => !e)} className="text-xs text-zy-light-blue underline">
          {expanded ? "Cancel" : "File New Review"}
        </button>
      </div>

      {reviews.length > 0 && (
        <div className="space-y-2 mb-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-white/10 rounded-md p-3 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white font-medium">{r.review_quarter}</p>
                {r.drift_identified && (
                  <span className="text-xs text-amber-400 uppercase tracking-wide">Drift Identified</span>
                )}
              </div>
              <p className="text-xs text-zy-chrome mt-1">
                Filed {new Date(r.submitted_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {reviews.length === 0 && !expanded && (
        <p className="text-sm text-zy-chrome">No reviews filed yet.</p>
      )}

      {expanded && (
        <div className="pt-3 border-t border-white/10">
          <div className="mb-3">
            <label className="block text-xs text-zy-chrome mb-1">Review Quarter</label>
            <input
              type="text"
              value={reviewQuarter}
              onChange={(e) => setReviewQuarter(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-zy-chrome mb-1">Decision Flow Notes</label>
            <textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              rows={2}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-zy-chrome mb-1">Money Flow Notes</label>
            <textarea
              value={moneyNotes}
              onChange={(e) => setMoneyNotes(e.target.value)}
              rows={2}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-zy-chrome mb-1">Responsibility Flow Notes</label>
            <textarea
              value={responsibilityNotes}
              onChange={(e) => setResponsibilityNotes(e.target.value)}
              rows={2}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zy-chrome mb-3">
            <input type="checkbox" checked={driftIdentified} onChange={(e) => setDriftIdentified(e.target.checked)} />
            Has any practice drifted from the documented standard?
          </label>
          {driftIdentified && (
            <div className="mb-3">
              <label className="block text-xs text-zy-chrome mb-1">Corrective Action (required)</label>
              <textarea
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                rows={2}
                className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white"
              />
            </div>
          )}
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-zy-electric hover:bg-zy-royal transition-colors text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
          >
            {saving ? "Filing..." : "File Review"}
          </button>
        </div>
      )}
    </div>
  );
}
