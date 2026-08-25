// app/faq/page.tsx
//
// Public FAQ page. Server-rendered, so it's real indexable content for SEO,
// with a client-side search box on top powered by /api/kb/search.
// This is the page to link from the site nav / footer.

import { createServiceRoleClient } from '@/lib/supabase/server';
import FaqSearch from './FaqSearch';

export const revalidate = 3600; // re-fetch from Supabase at most once an hour

type Row = { id: string; category: string; source: string; question: string; answer: string };

export default async function FaqPage() {
  const supabase = createServiceRoleClient();

  const { data } = await supabase
    .from('knowledge_base_qa')
    .select('id, category, source, question, answer')
    .order('source', { ascending: true });

  const rows = (data ?? []) as Row[];
  const chapters = rows.filter((r) => r.category === 'chapter');
  const glossary = rows.filter((r) => r.category === 'glossary');

  // Group chapter rows under their chapter heading, preserving manual order.
  const bySource = new Map<string, Row[]>();
  for (const r of chapters) {
    if (!bySource.has(r.source)) bySource.set(r.source, []);
    bySource.get(r.source)!.push(r);
  }

  return (
    <main className="min-h-screen bg-[#0A0F2E] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="mt-3 text-white/70">
          Answers pulled directly from the Zytrion Enterprise in Motion Manual. Search below,
          or browse by chapter.
        </p>

        <div className="mt-8">
          <FaqSearch />
        </div>

        <section className="mt-14 space-y-12">
          {Array.from(bySource.entries()).map(([source, items]) => (
            <div key={source}>
              <h2 className="text-lg font-semibold text-[#4AB3E8]">{source}</h2>
              <div className="mt-4 space-y-4">
                {items.map((item) => (
                  <details
                    key={item.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-4 open:bg-white/[0.07]"
                  >
                    <summary className="cursor-pointer text-sm font-medium text-white">
                      {item.question}
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-white/80">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold text-[#4AB3E8]">Glossary</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {glossary.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-medium text-white">
                  {item.question.replace('What does Zytrion mean by ', '').replace(/\?$/, '')}
                </div>
                <p className="mt-1 text-sm text-white/70">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
