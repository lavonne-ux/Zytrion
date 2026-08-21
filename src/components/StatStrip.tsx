import { createClient } from "@/lib/supabase/server";

// Renders live counts from public_proof_stats. Reads through the
// RLS server client (anon key), consistent with the public read
// policy already on this table. Fails closed: any query error or
// missing data hides the strip instead of showing a broken state.
export default async function StatStrip() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("public_proof_stats")
    .select("stat_key, stat_value")
    .in("stat_key", ["assessments_completed", "avg_score"]);

  if (error || !data || data.length === 0) {
    return null;
  }

  const statMap = Object.fromEntries(
    data.map((row) => [row.stat_key, row.stat_value])
  );

  const completed = statMap["assessments_completed"];
  const avgScoreRaw = statMap["avg_score"];
  const avgScore = avgScoreRaw != null ? Number(avgScoreRaw).toFixed(1) : null;

  if (!completed && !avgScore) {
    return null;
  }

  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-20 text-center">
        {completed && (
          <div>
            <p className="text-4xl font-semibold text-zy-electric">{completed}</p>
            <p className="mt-1 text-sm text-zy-chrome">Diagnostics Completed</p>
          </div>
        )}
        {avgScore && (
          <div>
            <p className="text-4xl font-semibold text-zy-electric">{avgScore}</p>
            <p className="mt-1 text-sm text-zy-chrome">Average Governance Score</p>
          </div>
        )}
      </div>
    </section>
  );
}
