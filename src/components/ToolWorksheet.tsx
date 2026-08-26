"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToolField, localToday } from "@/lib/tools/toolFieldTypes";

export default function ToolWorksheet({
  toolId,
  kitPhaseId,
  toolName,
  fieldSchema,
}: {
  toolId: string;
  kitPhaseId: string;
  toolName: string;
  fieldSchema: ToolField[];
}) {
  const router = useRouter();
  const today = localToday();

  const emptyEntry = () =>
    Object.fromEntries(
      fieldSchema.map((f: any) => {
        if (f.type === "repeatable_row") {
          // Some repeatable fields ship real starting rows, e.g. the four
          // standard approval-threshold tiers, so the client edits a real
          // starting point instead of inventing categories from scratch.
          if (f.default_rows && f.columns) {
            const rows = f.default_rows.map((row: string[]) =>
              Object.fromEntries(f.columns.map((col: string, i: number) => [col, row[i] ?? ""]))
            );
            return [f.name, rows];
          }
          return [f.name, []];
        }
        return [f.name, ""];
      })
    );

  const [entries, setEntries] = useState<Record<string, any>[]>([]);
  const [current, setCurrent] = useState<Record<string, any>>(emptyEntry());
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tools/get-submission?kitPhaseId=${kitPhaseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.submittedData?.entries) {
          setEntries(data.submittedData.entries);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingExisting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kitPhaseId]);

  function setCurrentField(name: string, val: any) {
    setCurrent((c) => ({ ...c, [name]: val }));
  }

  function addSubRow(name: string, columns: string[]) {
    const empty = Object.fromEntries(columns.map((c) => [c, ""]));
    setCurrent((c) => ({ ...c, [name]: [...(c[name] ?? []), empty] }));
  }

  function updateSubRow(name: string, idx: number, col: string, val: string) {
    setCurrent((c) => {
      const rows = [...(c[name] ?? [])];
      rows[idx] = { ...rows[idx], [col]: val };
      return { ...c, [name]: rows };
    });
  }

  function removeSubRow(name: string, idx: number) {
    setCurrent((c) => ({ ...c, [name]: (c[name] ?? []).filter((_: any, i: number) => i !== idx) }));
  }

  function addEntry() {
    const hasAnyValue = Object.values(current).some((v) => String(v).trim() !== "");
    if (!hasAnyValue) {
      setError("Fill in at least one field before adding.");
      return;
    }
    setError(null);
    setEntries((e) => [...e, current]);
    setCurrent(emptyEntry());
  }

  function removeEntry(idx: number) {
    setEntries((e) => e.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    const toSave = entries.length > 0 ? entries : [current].filter((c) => Object.values(c).some((v) => String(v).trim() !== ""));
    if (toSave.length === 0) {
      setError("Add at least one entry before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, kitPhaseId, toolName, submittedData: { entries: toSave }, autoApprove: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        setSaving(false);
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  function renderInput(field: ToolField) {
    const label = field.label ?? field.name;
    const common = "w-full bg-white/[0.03] border border-white/10 rounded-md p-2.5 text-sm text-white";

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.name} className="mb-3">
            <label className="block text-xs text-zy-chrome mb-1">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/50 mb-1">{field.hint}</p>}
            <textarea
              value={current[field.name] ?? ""}
              onChange={(e) => setCurrentField(field.name, e.target.value)}
              rows={2}
              className={common}
            />
          </div>
        );
      case "date":
        return (
          <div key={field.name} className="mb-3">
            <label className="block text-xs text-zy-chrome mb-1">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/50 mb-1">{field.hint}</p>}
            <input
              type="date"
              value={current[field.name] ?? ""}
              max={field.default === "today" ? today : undefined}
              onChange={(e) => setCurrentField(field.name, e.target.value)}
              className={common}
            />
          </div>
        );
      case "number":
        return (
          <div key={field.name} className="mb-3">
            <label className="block text-xs text-zy-chrome mb-1">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/50 mb-1">{field.hint}</p>}
            <input
              type="number"
              value={current[field.name] ?? ""}
              onChange={(e) => setCurrentField(field.name, e.target.value)}
              className={common}
            />
          </div>
        );
      case "select":
        return (
          <div key={field.name} className="mb-3">
            <label className="block text-xs text-zy-chrome mb-1">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/50 mb-1">{field.hint}</p>}
            <select
              value={current[field.name] ?? ""}
              onChange={(e) => setCurrentField(field.name, e.target.value)}
              className={common}
            >
              <option value="" style={{ backgroundColor: "#0A0F2E", color: "#FFFFFF" }}>Select...</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt} style={{ backgroundColor: "#0A0F2E", color: "#FFFFFF" }}>{opt}</option>
              ))}
            </select>
          </div>
        );
      case "repeatable_row":
        return (
          <div key={field.name} className="mb-3">
            <label className="block text-xs text-zy-chrome mb-2">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/50 mb-2">{field.hint}</p>}
            <div className="space-y-2">
              {(current[field.name] ?? []).map((row: Record<string, string>, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                  {(field.columns ?? []).map((col) => (
                    <input
                      key={col}
                      type="text"
                      placeholder={col}
                      value={row[col] ?? ""}
                      onChange={(e) => updateSubRow(field.name, idx, col, e.target.value)}
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => removeSubRow(field.name, idx)}
                    className="text-xs text-red-400 px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addSubRow(field.name, field.columns ?? [])}
              className="mt-2 text-xs text-zy-light-blue underline"
            >
              + Add row
            </button>
          </div>
        );

      default:
        return (
          <div key={field.name} className="mb-3">
            <label className="block text-xs text-zy-chrome mb-1">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/50 mb-1">{field.hint}</p>}
            <input
              type="text"
              value={current[field.name] ?? ""}
              onChange={(e) => setCurrentField(field.name, e.target.value)}
              className={common}
            />
          </div>
        );
    }
  }

  if (done) {
    return (
      <div className="border border-zy-electric rounded-lg p-6 bg-zy-electric/10">
        <p className="text-white font-medium">{toolName} saved.</p>
        <p className="text-sm text-zy-chrome mt-1">Your advisor will review it shortly.</p>
      </div>
    );
  }

  if (loadingExisting) {
    return (
      <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
        <p className="text-sm text-zy-chrome">Loading...</p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
      {entries.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="text-xs text-zy-chrome/70 uppercase tracking-wide">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} added
          </p>
          {entries.map((entry, idx) => (
            <div key={idx} className="border border-white/10 rounded-md p-3 bg-white/[0.02] flex items-center justify-between">
              <p className="text-sm text-white">
                {Object.values(entry).find((v) => String(v).trim() !== "") || `Entry ${idx + 1}`}
              </p>
              <button
                type="button"
                onClick={() => removeEntry(idx)}
                className="text-xs text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-white font-medium mb-3">Add {entries.length > 0 ? "another" : "an"} entry</p>
      {fieldSchema.map((field) => renderInput(field))}

      <button
        type="button"
        onClick={addEntry}
        className="mb-4 text-xs text-zy-light-blue underline"
      >
        + Add this entry
      </button>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-6 py-2.5 rounded-md text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : `Save ${toolName}`}
        </button>
      </div>
    </div>
  );
}
