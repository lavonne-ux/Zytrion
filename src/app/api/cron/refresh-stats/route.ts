import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Refreshes public_proof_stats for the homepage stat strip and founder
// count. Triggered by an external scheduler (not Vercel's built-in cron,
// which caps Hobby at once a day), so this stays on Hobby and refreshes
// hourly instead. Protected by a shared secret in the query string, since
// external callers don't get Vercel's automatic CRON_SECRET header.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!process.env.STATS_REFRESH_SECRET || secret !== process.env.STATS_REFRESH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { count: assessmentsCompleted, error: countError } = await supabase
    .from("assessments")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const { data: scoreRows, error: scoreError } = await supabase
    .from("assessments")
    .select("total_score");

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
        label: "Free diagnostics completed",
        value: String(assessmentsCompleted ?? 0),
        source: "Zytrion live data",
        is_live: true,
        last_updated: now,
      },
      {
        stat_key: "avg_score",
        label: "Average score",
        value: avgScore !== null ? String(avgScore) : "\u2014",
        source: "Zytrion live data",
        is_live: true,
        last_updated: now,
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
