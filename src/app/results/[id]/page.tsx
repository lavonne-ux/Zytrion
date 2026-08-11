import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

interface PillarScoreRow {
  section_total: number;
  pillars: { pillar_name: string } | null;
}

async function getAssessment(id: string) {
  const supabase = createAdminClient();

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, total_score, contact_name, contact_business, taken_at, tiers ( name, tier_number, one_line_summary )")
    .eq("id", id)
    .single();

  if (!assessment) return null;

  const { data: pillarScores } = await supabase
    .from("pillar_scores")
    .select("section_total, pillars ( pillar_name )")
    .eq("assessment_id", id);

  return { assessment, pillarScores: (pillarScores ?? []) as unknown as PillarScoreRow[] };
}

export default async function ResultsPage({ params }: { params: { id: string } }) {
  const data = await getAssessment(params.id);
  if (!data || !data.assessment) return notFound();

  const { assessment, pillarScores } = data;
  const tier = (assessment as any).tiers;
  const lowest = pillarScores.reduce(
    (min, p) => (p.section_total < min.section_total ? p : min),
    pillarScores[0]
  );

  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-zy-light-blue text-sm font-medium tracking-wide uppercase mb-2">
          Your GRID Diagnostic Result
        </p>
        <h1 className="text-2xl font-semibold mb-1">
          {assessment.contact_business || assessment.contact_name}
        </h1>

        {/* Score circle */}
        <div className="mt-10 flex flex-col items-center">
          <div className="relative w-40 h-40 rounded-full border-4 border-zy-electric flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-semibold">{assessment.total_score}</div>
              <div className="text-xs text-zy-chrome">out of 80</div>
            </div>
          </div>
          <p className="mt-6 text-xl font-medium text-white">{tier?.name}</p>
          <p className="mt-2 text-zy-chrome text-center max-w-md">
            {tier?.one_line_summary}
          </p>
        </div>

        {/* Pillar breakdown */}
        <div className="mt-14">
          <h2 className="text-lg font-semibold mb-6">Your five pillars</h2>
          <div className="space-y-4">
            {pillarScores.map((p, i) => {
              const isLowest = p === lowest;
              const pct = (p.section_total / 16) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={isLowest ? "text-white font-medium" : "text-zy-chrome"}>
                      {p.pillars?.pillar_name}
                      {isLowest && (
                        <span className="ml-2 text-xs text-zy-electric uppercase tracking-wide">
                          Weakest link
                        </span>
                      )}
                    </span>
                    <span className="text-zy-chrome">{p.section_total} / 16</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isLowest ? "bg-zy-electric" : "bg-zy-royal"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-14 border border-white/10 rounded-lg p-6 bg-white/[0.02]">
          <p className="text-zy-chrome leading-relaxed">
            Your lowest pillar,{" "}
            <span className="text-white font-medium">{lowest.pillars?.pillar_name}</span>,
            is the structural bottleneck to close first. That is the
            single next step, before anything else, since every other
            pillar depends on it holding.
          </p>
        </div>
      </div>
    </main>
  );
}
