"use client";
import { useState, useEffect } from "react";
import { localToday } from "@/lib/tools/toolFieldTypes";

type Transaction = {
  id: string;
  transaction_date: string;
  amount: number;
  description: string;
  authorization_exists: boolean;
  flagged: boolean;
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else current += char;
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ""));
    return row;
  });
}

export default function FinancialTraceabilityWorksheet({
  toolId,
  kitPhaseId,
  toolName,
}: {
  toolId: string;
  kitPhaseId: string;
  toolName: string;
}) {
  const today = localToday();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [transactionDate, setTransactionDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [authorizationExists, setAuthorizationExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  function load(pageNum: number) {
    fetch(`/api/financial-transactions?kitPhaseId=${kitPhaseId}&page=${pageNum}`)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.transactions ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
        setPage(pageNum);
      });
  }

  useEffect(() => {
    load(1);
  }, [kitPhaseId]);

  async function handleAdd() {
    if (!amount || !description.trim()) {
      setError("Amount and description are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/financial-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kitPhaseId,
          transactionDate,
          amount: parseFloat(amount),
          description,
          authorizationExists,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setAmount("");
      setDescription("");
      setAuthorizationExists(false);
      load(1);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCsvSelect(file: File) {
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text).map((r) => ({
        transactionDate: r.transaction_date,
        amount: r.amount,
        description: r.description,
        authorizationExists: r.authorization_exists === "true" || r.authorization_exists === "1",
      }));
      const res = await fetch("/api/financial-transactions/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitPhaseId, rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportResult(data.error ?? "Import failed.");
      } else {
        setImportResult(`Imported ${data.imported} transaction(s).${data.skipped > 0 ? ` ${data.skipped} row(s) skipped, missing required fields.` : ""}`);
        load(1);
      }
    } catch {
      setImportResult("Could not read the file.");
    } finally {
      setImporting(false);
    }
  }

  if (!transactions) {
    return (
      <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
        <p className="text-sm text-zy-chrome">Loading...</p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
      <p className="text-xs text-zy-chrome mb-4">{total} transaction(s) on record</p>

      {transactions.length > 0 && (
        <div className="space-y-1 mb-4">
          {transactions.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between border rounded-md p-2 text-sm ${
                t.flagged ? "border-red-400/40 bg-red-400/5" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div>
                <span className="text-white">{t.description}</span>
                <span className="text-zy-chrome text-xs ml-2">
                  {new Date(t.transaction_date + "T00:00:00").toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {t.flagged && <span className="text-xs text-red-400 uppercase">Flagged</span>}
                <span className="text-white font-medium">${t.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => load(page - 1)}
            disabled={page <= 1}
            className="text-xs text-zy-light-blue underline disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-xs text-zy-chrome">Page {page} of {totalPages}</span>
          <button
            onClick={() => load(page + 1)}
            disabled={page >= totalPages}
            className="text-xs text-zy-light-blue underline disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      <div className="border-t border-white/10 pt-4 mb-4">
        <p className="text-sm text-white font-medium mb-2">Add a transaction</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="date"
            value={transactionDate}
            max={today}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white"
          />
        </div>
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-md p-2 text-sm text-white mb-2"
        />
        <label className="flex items-center gap-2 text-xs text-zy-chrome mb-2">
          <input type="checkbox" checked={authorizationExists} onChange={(e) => setAuthorizationExists(e.target.checked)} />
          Documented authorization exists
        </label>
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <button
          onClick={handleAdd}
          disabled={saving}
          className="bg-zy-electric hover:bg-zy-royal transition-colors text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Transaction"}
        </button>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-sm text-white font-medium mb-1">Bulk import from CSV</p>
        <p className="text-xs text-zy-chrome/60 mb-2">
          Columns: transaction_date, amount, description, authorization_exists (true/false)
        </p>
        <label className="inline-block">
          <span className="text-xs text-zy-light-blue underline cursor-pointer">
            {importing ? "Importing..." : "+ Choose CSV file"}
          </span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            disabled={importing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCsvSelect(file);
              e.target.value = "";
            }}
          />
        </label>
        {importResult && <p className="text-xs text-zy-chrome mt-2">{importResult}</p>}
      </div>
    </div>
  );
}
