"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToolField, localToday, initialValuesFor } from "@/lib/tools/toolFieldTypes";

export default function ToolForm({
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

  const [values, setValues] = useState<Record<string, any>>(() => initialValuesFor(fieldSchema));
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tools/get-submission?kitPhaseId=${kitPhaseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.submittedData) {
          setValues((v) => ({ ...v, ...data.submittedData }));
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

  function setField(name: string, val: any) {
    setValues((v) => ({ ...v, [name]: val }));
  }

  function addRow(name: string, columns: string[]) {
    const empty = Object.fromEntries(columns.map((c) => [c, ""]));
    setValues((v) => ({ ...v, [name]: [...(v[name] ?? []), empty] }));
  }

  function updateRow(name: string, idx: number, col: string, val: string) {
    setValues((v) => {
      const rows = [...(v[name] ?? [])];
      rows[idx] = { ...rows[idx], [col]: val };
      return { ...v, [name]: rows };
    });
  }

  function removeRow(name: string, idx: number) {
    setValues((v) => ({ ...v, [name]: (v[name] ?? []).filter((_: any, i: number) => i !== idx) }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, kitPhaseId, toolName, submittedData: values, autoApprove: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit.");
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

  function renderField(field: ToolField) {
    const label = field.label ?? field.name;

    if (field.shown_when) {
      const [depName, , depVal] = field.shown_when.split(" ");
      if (values[depName] !== depVal) return null;
    }

    switch (field.type) {
      case "text":
      case "text_or_user_reference":
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm text-zy-chrome mb-1">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/60 mb-1">{field.hint}</p>}
            <input
              type="text"
              value={values[field.name] ?? ""}
              onChange={(e) => setField(field.name, e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2.5 text-sm text-white"
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm text-zy-chrome mb-1">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/60 mb-1">{field.hint}</p>}
            <textarea
              value={values[field.name] ?? ""}
              onChange={(e) => setField(field.name, e.target.value)}
              rows={3}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2.5 text-sm text-white"
            />
          </div>
        );

      case "date":
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm text-zy-chrome mb-1">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/60 mb-1">{field.hint}</p>}
            <input
              type="date"
              value={values[field.name] ?? ""}
              max={field.default === "today" ? today : undefined}
              onChange={(e) => setField(field.name, e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2.5 text-sm text-white"
            />
          </div>
        );

      case "number":
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm text-zy-chrome mb-1">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/60 mb-1">{field.hint}</p>}
            <input
              type="number"
              value={values[field.name] ?? ""}
              onChange={(e) => setField(field.name, e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2.5 text-sm text-white"
            />
          </div>
        );

      case "currency":
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm text-zy-chrome mb-1">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/60 mb-1">{field.hint}</p>}
            <div className="flex items-center">
              <span className="text-zy-chrome mr-2">$</span>
              <input
                type="number"
                step="0.01"
                value={values[field.name] ?? ""}
                onChange={(e) => setField(field.name, e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2.5 text-sm text-white"
              />
            </div>
          </div>
        );

      case "boolean":
        return (
          <div key={field.name} className="mb-4">
            <label className="flex items-center gap-2 text-sm text-zy-chrome">
              <input
                type="checkbox"
                checked={Boolean(values[field.name])}
                onChange={(e) => setField(field.name, e.target.checked)}
              />
              {label}
            </label>
            {field.hint && <p className="text-xs text-zy-chrome/60 mt-1 ml-6">{field.hint}</p>}
          </div>
        );

      case "select":
      case "select_fixed_plus_custom":
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm text-zy-chrome mb-1">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/60 mb-1">{field.hint}</p>}
            <select
              value={values[field.name] ?? ""}
              onChange={(e) => setField(field.name, e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2.5 text-sm text-white"
            >
              <option value="">Select...</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              {field.type === "select_fixed_plus_custom" && <option value="__custom__">Other (describe below)</option>}
            </select>
            {field.type === "select_fixed_plus_custom" && values[field.name] === "__custom__" && (
              <input
                type="text"
                placeholder="Describe the custom decision type"
                value={values[`${field.name}_custom`] ?? ""}
                onChange={(e) => setField(`${field.name}_custom`, e.target.value)}
                className="mt-2 w-full bg-white/[0.03] border border-white/10 rounded-md p-2.5 text-sm text-white"
              />
            )}
          </div>
        );

      case "generated":
        if (field.name === "signature") {
          return (
            <div key={field.name} className="mb-4">
              <label className="block text-sm text-zy-chrome mb-1">
                Type your full legal name to sign
              </label>
              <input
                type="text"
                value={values[field.name] ?? ""}
                onChange={(e) => setField(field.name, e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2.5 text-sm text-white"
              />
              <p className="text-xs text-zy-chrome/60 mt-1">
                Timestamped automatically when you submit.
              </p>
            </div>
          );
        }
        return null;

      case "repeatable_row":
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm text-zy-chrome mb-2">{label}</label>
            {field.hint && <p className="text-xs text-zy-chrome/60 mb-2">{field.hint}</p>}
            <div className="space-y-2">
              {(values[field.name] ?? []).map((row: Record<string, string>, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                  {(field.columns ?? []).map((col) => (
                    <input
                      key={col}
                      type="text"
                      placeholder={col}
                      value={row[col] ?? ""}
                      onChange={(e) => updateRow(field.name, idx, col, e.target.value)}
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => removeRow(field.name, idx)}
                    className="text-xs text-red-400 px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addRow(field.name, field.columns ?? [])}
              className="mt-2 text-xs text-zy-light-blue underline"
            >
              + Add row
            </button>
          </div>
        );

      case "conditional_block":
        return (
          <div key={field.name} className="mb-4 border border-white/10 rounded-md p-4 bg-white/[0.02]">
            <p className="text-sm text-zy-chrome mb-3">{label}</p>
            {(field.fields ?? []).map((sub) => renderField({ ...sub, name: `${field.name}.${sub.name}`, label: sub.name }))}
          </div>
        );

      default:
        return null;
    }
  }

  if (done) {
    return (
      <div className="border border-zy-electric rounded-lg p-6 bg-zy-electric/10">
        <p className="text-white font-medium">{toolName} submitted.</p>
        <p className="text-sm text-zy-chrome mt-1 mb-4">Your record has been saved.</p>
        
          <a
          href={`/api/tools/generate-pdf?kitPhaseId=${kitPhaseId}`}
          className="inline-block bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-6 py-2.5 rounded-md text-sm"
        >
          Download PDF
        </a>
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
      {fieldSchema.map((field) => renderField(field))}
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-6 py-2.5 rounded-md text-sm disabled:opacity-50"
      >
        {saving ? "Submitting..." : `Submit ${toolName}`}
      </button>
    </div>
  );
}
