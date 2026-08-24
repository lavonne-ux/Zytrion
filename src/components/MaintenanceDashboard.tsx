"use client";
import { useState, useEffect } from "react";

type MaintenanceField = {
  name: string;
  label?: string;
  type: string;
  required_for_frequency?: string;
};

type MaintenanceItem = {
  id: string;
  discipline: string;
  frequency: string;
  fieldSchema: MaintenanceField[];
  status: "On Time" | "Upcoming" | "Overdue";
  dueDate: string | null;
  lastCompletedAt: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  "On Time": "text-zy-electric border-zy-electric/30 bg-zy-electric/5",
  Upcoming: "text-amber-400 border-amber-400/30 bg-amber-400/5",
  Overdue: "text-red-400 border-red-400/30 bg-red-400/5",
};

function MaintenanceItemRow({ item, onComplete }: { item: MaintenanceItem; onComplete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [evidence, setEvidence] = useState<{ path: string; fileName: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresEvidence = item.frequency === "annual";

  async function handleFileSelect(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sectionName", item.discipline);
      formData.append("kitPhaseId", item.id);
      const res = await fetch("/api/tools/upload-file", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setEvidence({ path: data.path, fileName: data.fileName });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!note.trim()) {
      setError("Describe what you reviewed or confirmed.");
      return;
    }
    if (requiresEvidence && !evidence) {
      setError("This is an annual item, evidence is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/maintenance/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceItemId: item.id,
          completionNote: note,
          evidencePath: evidence?.path,
          evidenceFileName: evidence?.fileName,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not save.");
        return;
      }
      setNote("");
      setEvidence(null);
      setExpanded(false);
      onComplete();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`border rounded-lg p-4 mb-2 ${STATUS_STYLES[item.status]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white font-medium">{item.discipline}</p>
          <p className="text-xs text-zy-chrome capitalize">
            {item.frequency.replace("_", "-")} ·{" "}
            {item.lastCompletedAt
              ? `Last done ${new Date(item.lastCompletedAt).toLocaleDateString()}`
              : "Not yet done"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide">{item.status}</span>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-zy-light-blue underline"
          >
            {expanded ? "Cancel" : "Mark Complete"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you review or confirm?"
            rows={2}
            className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2.5 text-sm text-white mb-2"
          />
          {requiresEvidence && (
            <div className="mb-2">
              {evidence ? (
                <p className="text-xs text-zy-electric">{evidence.fileName} attached</p>
              ) : (
                <label className="inline-block">
                  <span className="text-xs text-zy-light-blue underline cursor-pointer">
                    {uploading ? "Uploading..." : "+ Attach evidence (required, annual item)"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          )}
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-zy-electric hover:bg-zy-royal transition-colors text-white text-xs font-medium px-4 py-2 rounded-md disabled:opacity-50"
          >
            {saving ? "Saving..." : "Confirm Complete"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MaintenanceDashboard() {
  const [items, setItems] = useState<MaintenanceItem[] | null>(null);

  function load() {
    fetch("/api/maintenance/dashboard")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  if (!items) {
    return <p className="text-sm text-zy-chrome">Loading...</p>;
  }

  const overdue = items.filter((i) => i.status === "Overdue");
  const upcoming = items.filter((i) => i.status === "Upcoming");
  const onTime = items.filter((i) => i.status === "On Time");

  return (
    <div>
      {overdue.length > 0 && (
        <>
          <p className="text-xs text-red-400 uppercase tracking-wide mb-2">Overdue ({overdue.length})</p>
          {overdue.map((item) => (
            <MaintenanceItemRow key={item.id} item={item} onComplete={load} />
          ))}
        </>
      )}
      {upcoming.length > 0 && (
        <>
          <p className="text-xs text-amber-400 uppercase tracking-wide mb-2 mt-4">Upcoming ({upcoming.length})</p>
          {upcoming.map((item) => (
            <MaintenanceItemRow key={item.id} item={item} onComplete={load} />
          ))}
        </>
      )}
      {onTime.length > 0 && (
        <>
          <p className="text-xs text-zy-chrome uppercase tracking-wide mb-2 mt-4">On Time ({onTime.length})</p>
          {onTime.map((item) => (
            <MaintenanceItemRow key={item.id} item={item} onComplete={load} />
          ))}
        </>
      )}
    </div>
  );
}
