"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminNoteForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [noteText, setNoteText] = useState("");
  const [visibleToClient, setVisibleToClient] = useState(false);
  const [actionItemDescription, setActionItemDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!noteText.trim()) {
      setError("Note can't be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/create-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          noteText,
          visibleToClient,
          actionItemDescription: actionItemDescription.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not save.");
        setSaving(false);
        return;
      }
      setNoteText("");
      setActionItemDescription("");
      setVisibleToClient(false);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] mb-8">
      <p className="text-white font-semibold mb-3">Add a Note</p>
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="What was discussed, what you observed, your read on where things stand..."
        rows={4}
        className="w-full bg-white/[0.03] border border-white/10 rounded-md p-3 text-sm text-white placeholder:text-zy-chrome/50 mb-3"
      />
      <label className="flex items-center gap-2 text-sm text-zy-chrome mb-4">
        <input
          type="checkbox"
          checked={visibleToClient}
          onChange={(e) => setVisibleToClient(e.target.checked)}
        />
        Visible to client
      </label>
      <input
        value={actionItemDescription}
        onChange={(e) => setActionItemDescription(e.target.value)}
        placeholder="Optional: add an action item for the client"
        className="w-full bg-white/[0.03] border border-white/10 rounded-md p-3 text-sm text-white placeholder:text-zy-chrome/50 mb-4"
      />
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-6 py-2.5 rounded-md text-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
