'use client';

// app/faq/FaqSearch.tsx
// Search box for the FAQ page. Same /api/kb/search endpoint the widget uses.

import { useState } from 'react';

type KBResult = { id: string; source: string; question: string; answer: string };

export default function FaqSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KBResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/kb/search?q=${encodeURIComponent(query)}&limit=6`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the manual…"
          className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-[#4AB3E8]"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#1565FF] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {results && (
        <div className="mt-4 space-y-3">
          {results.length === 0 && (
            <p className="text-sm text-white/60">No direct match found. Try different wording.</p>
          )}
          {results.map((r) => (
            <div key={r.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-[#4AB3E8]">
                {r.source}
              </div>
              <div className="mt-1 text-sm font-medium text-white">{r.question}</div>
              <p className="mt-1 text-sm text-white/80">{r.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
