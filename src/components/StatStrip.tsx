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

  // The completed count is held back until it argues for the company rather
  // than against it. It now reports only real external diagnostics, with the
  // founder's own test runs excluded, so the honest figure is small and sits
  // directly under a line inviting visitors to join other founders. Shown
  // below this threshold it undercuts the sentence above it.
  //
  // The average score has no such problem. It is the stronger number of the
  // two at any sample size, because a low average is the argument: businesses
  // are failing at governance and that is what this company exists to fix.
  // Nothing here is untrue, one figure is simply not displayed yet.
  //
  // Raise or lower this as the real number grows. At 25 the count starts
  // doing useful work.
  const COUNT_DISPLAY_THRESHOLD = 25;
  const completedNumber = completed != null ? Number(completed) : null;
  const showCompleted =
    completedNumber != null &&
    Number.isFinite(completedNumber) &&
    completedNumber >= COUNT_DISPLAY_THRESHOLD;

  if (!showCompleted && !avgScore) {
    return null;
  }

  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-20 text-center">
        {showCompleted && (
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
