// app/api/kb/search/route.ts
//
// Zero-cost knowledge base search. Queries knowledge_base_qa directly via
// Postgres full-text search (the search_vector column + GIN index already
// built in Supabase). No external AI API call, no per-query charge.
//
// GET /api/kb/search?q=your+question&limit=5

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Uses the service role key on the server only. Never expose this key
// client-side. If you already have a shared server client (e.g.
// lib/supabase/server.ts), swap this out for that instead of duplicating
// the client here.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const limit = Math.min(Number(searchParams.get('limit')) || 5, 20);

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Query too short. Provide at least 2 characters.' },
      { status: 400 }
    );
  }

  // plainto_tsquery tolerates natural-language phrasing ("what is decision flow")
  // far better than a hand-built boolean query, which is what a real user types.
  const { data, error } = await supabase.rpc('kb_search', {
    search_query: q,
    result_limit: limit,
  });

  if (error) {
    console.error('kb_search error:', error);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }

  return NextResponse.json({ query: q, results: data ?? [] });
}
