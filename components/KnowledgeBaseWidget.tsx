'use client';

// components/KnowledgeBaseWidget.tsx
//
// Floating chat-style widget. Feels conversational, but every response is
// a database lookup against knowledge_base_qa via /api/kb/search, not an
// AI-generated reply. Zero marginal cost per use.
//
// Drop <KnowledgeBaseWidget /> once, near the root layout, so it floats
// on every page. Uses the zy-purple token already live in Tailwind config;
// swap the color classes below if you want it tied to a different accent.

import { useState, useRef, useEffect } from 'react';

type KBResult = {
  id: string;
  category: 'chapter' | 'glossary';
  source: string;
  question: string;
  answer: string;
  rank: number;
};

type ChatTurn = {
  role: 'user' | 'assistant';
  text?: string;
  results?: KBResult[];
};

export default function KnowledgeBaseWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: 'assistant',
      text: "Ask about governance readiness, GRID, the Five Pillars, or anything in the Enterprise in Motion Manual.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setTurns((t) => [...t, { role: 'user', text: query }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/api/kb/search?q=${encodeURIComponent(query)}&limit=3`);
      const data = await res.json();

      if (!res.ok || !data.results?.length) {
        setTurns((t) => [
          ...t,
          {
            role: 'assistant',
            text: "I couldn't find a direct match for that in the manual. Try rephrasing, or book a consultation for something specific to your situation.",
          },
        ]);
      } else {
        setTurns((t) => [...t, { role: 'assistant', results: data.results }]);
      }
    } catch {
      setTurns((t) => [
        ...t,
        { role: 'assistant', text: 'Something went wrong on that search. Try again in a moment.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {open && (
        <div className="mb-3 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F2E] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#0B3DBF] to-[#1565FF] px-4 py-3">
            <div className="text-sm font-semibold text-white">Zytrion Knowledge Base</div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Turns */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {turns.map((turn, i) =>
              turn.role === 'user' ? (
                <div key={i} className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-[#1565FF] px-3 py-2 text-sm text-white">
                  {turn.text}
                </div>
              ) : turn.results ? (
                <div key={i} className="space-y-2">
                  {turn.results.map((r) => (
                    <div
                      key={r.id}
                      className="max-w-[92%] rounded-xl rounded-bl-sm border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90"
                    >
                      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#4AB3E8]">
                        {r.source}
                      </div>
                      <p className="leading-relaxed">{r.answer}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div key={i} className="max-w-[85%] rounded-xl rounded-bl-sm border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
                  {turn.text}
                </div>
              )
            )}
            {loading && (
              <div className="max-w-[60%] rounded-xl rounded-bl-sm border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50">
                Searching…
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                className="flex-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-[#4AB3E8]"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[#1565FF] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Ask
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open knowledge base chat"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0B3DBF] to-[#1565FF] text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
