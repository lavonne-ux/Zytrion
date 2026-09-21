import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { excludeTestAccounts } from "@/lib/assessment/testAccounts";

// Refreshes public_proof_stats for the homepage stat strip and founder
// count. Triggered by an external scheduler (not Vercel's built-in cron,
// which caps Hobby at once a day), so this stays on Hobby and refreshes
// hourly instead. Protected by a shared secret in the query string, since
// external callers don't get Vercel's automatic CRON_SECRET header.
//
// Display labels for each stat_key live in the homepage component, not
// here, this table has no label column.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!process.env.STATS_REFRESH_SECRET || secret !== process.env.STATS_REFRESH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Both figures are public proof, so both exclude the internal test
  // account. Without this the homepage reports the founder's own end to
  // end test runs as completed client diagnostics.
  const { count: assessmentsCompleted, error: countError } = await excludeTestAccounts(
    supabase.from("assessments").select("*", { count: "exact", head: true })
  );

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const { data: scoreRows, error: scoreError } = await excludeTestAccounts(
    supabase.from("assessments").select("total_score")
  );

  if (scoreError) {
    return NextResponse.json({ error: scoreError.message }, { status: 500 });
  }

  const scores = (scoreRows || [])
    .map((r) => r.total_score)
    .filter((s): s is number => typeof s === "number");

  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
      : null;

  const now = new Date().toISOString();

  const { error: upsertError } = await supabase.from("public_proof_stats").upsert(
    [
      {
        stat_key: "assessments_completed",
        stat_value: String(assessmentsCompleted ?? 0),
        source: "Zytrion live data",
        updated_at: now,
      },
      {
        stat_key: "avg_score",
        stat_value: avgScore !== null ? String(avgScore) : "\u2014",
        source: "Zytrion live data",
        updated_at: now,
      },
    ],
    { onConflict: "stat_key" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    refreshed: now,
    assessmentsCompleted,
    avgScore,
  });
}
