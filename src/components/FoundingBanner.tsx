// src/components/FoundingBanner.tsx
// Persistent thin bar above the hero. Light blue accent, single pulse on
// load (not looping, a one-shot animation via pulse-once in tailwind.config).
// Server Component: data fetch stays server-side, the animation is pure CSS
// so no client JS is needed to make it run once on paint.

import { createClient } from '@/lib/supabase/server';

export default async function FoundingBanner() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('public_proof_stats')
    .select('stat_value')
    .eq('stat_key', 'assessments_completed')
    .maybeSingle();

  // Fail closed: no banner rather than a banner with a fabricated or
  // stale number. Same rule as StatStrip and FounderCount.
  if (error || !data?.stat_value) {
    return null;
  }

  const count = Number(data.stat_value);
  if (!count || count <= 0) {
    return null;
  }

  return (
    <div className="w-full border-b border-zy-light-blue/20 bg-zy-near-black">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-2 text-center">
        <span
          className="h-2 w-2 flex-shrink-0 rounded-full bg-zy-light-blue animate-pulse-once"
          aria-hidden="true"
        />
        <p className="text-sm text-zy-chrome">
          <span className="font-semibold text-zy-light-blue">{count} founders</span>{' '}
          have already run their GRID.{' '}
          <span className="text-zy-chrome/80">Free during our founding period.</span>
        </p>
      </div>
    </div>
  );
}
