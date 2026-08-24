"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToolField, localToday } from "@/lib/tools/toolFieldTypes";

function findItemList(fieldSchema: ToolField[]): string[] {
  const generatedField = fieldSchema.find(
    (f) => f.type === "generated" && ((f as any).fixed_values || (f as any).fixed_items)
  ) as any;
  return generatedField?.fixed_values ?? generatedField?.fixed_items ?? [];
}

export default function ToolChecklist({
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
  const fixedItems = findItemList(fieldSchema);
  const itemFields = fieldSchema.filter((f) => f.type !== "generated");

  const emptyItemState = () => Object.fromEntries(itemFields.map((f) => [f.name, f.type === "boolean" ? false : ""]));

  const [items, setItems] = useState<Record<string, any>[]>(
    fixedItems.length > 0 ? fixedItems.map(() => emptyItemState()) : []
  );
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tools/get-submission?kitPhaseId=${kitPhaseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.submittedData?.items) {
          setItems(data.submittedData.items);
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

  function setItemField(idx: number, name: string, val: any) {
    setItems((its) => {
      const next = [...its];
      next[idx] = { ...next[idx], [name]: val };
      return next;
    });
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId,
          kitPhaseId,
          toolName,
          submittedData: { items },
          autoApprove: true,
        }),
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

  function renderItemField(field: ToolField, idx: number) {
    const label = field.label ?? field.name;
    const value = items[idx]?.[field.name];
    const common = "w-full bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white";

    if (field.type === "boolean") {
      return (
        <label key={field.name} className="flex items-center gap-2 text-xs text-zy-chrome mb-2">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => setItemField(idx, field.name, e.target.checked)} />
          {label}
        </label>
      );
    }
    if (field.type === "select") {
      return (
        <div key={field.name} className="mb-2">
          <label className="block text-xs text-zy-chrome mb-1">{label}</label>
          <select value={value ?? ""} onChange={(e) => setItemField(idx, field.name, e.target.value)} className={common}>
            <option value="">Select...</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }
    if (field.type === "textarea") {
      if (field.shown_when) {
        const [depName, , depVal] = field.shown_when.split(" ");
        if (items[idx]?.[depName] !== depVal) return null;
      }
      return (
        <div key={field.name} className="mb-2">
          <label className="block text-xs text-zy-chrome mb-1">{label}</label>
          <textarea value={value ?? ""} onChange={(e) => setItemField(idx, field.name, e.target.value)} rows={2} className={common} />
        </div>
      );
    }
    return (
      <div key={field.name} className="mb-2">
        <label className="block text-xs text-zy-chrome mb-1">{label}</label>
        <input type="text" value={value ?? ""} onChange={(e) => setItemField(idx, field.name, e.target.value)} className={common} />
      </div>
    );
  }

  if (done) {
    return (
      <div className="border border-zy-electric rounded-lg p-6 bg-zy-electric/10">
        <p className="text-white font-medium">{toolName} submitted.</p>
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

  if (fixedItems.length === 0) {
    return (
      <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
        <p className="text-sm text-zy-chrome">
          This checklist's item list is not yet populated. Contact your advisor before completing this section.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
      <div className="space-y-4 mb-4">
        {fixedItems.map((item, idx) => (
          <div key={idx} className="border border-white/10 rounded-md p-3 bg-white/[0.02]">
            <p className="text-sm text-white font-medium mb-2">{item}</p>
            {itemFields.map((field) => renderItemField(field, idx))}
          </div>
        ))}
      </div>
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
