import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";
import FullReportButton from "./FullReportButton";

export const dynamic = "force-dynamic";

interface PillarScoreRow {
  section_total: number;
  pillars: { pillar_name: string } | null;
}

async function getAssessment(id: string) {
  const supabase = createAdminClient();

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, total_score, contact_name, contact_business, taken_at, full_report_paid_at, tiers ( name, tier_number, one_line_summary )")
    .eq("id", id)
    .single();

  if (!assessment) return null;

  const { data: pillarScores } = await supabase
    .from("pillar_scores")
    .select("section_total, pillars ( pillar_name )")
    .eq("assessment_id", id);

  return { assessment, pillarScores: (pillarScores ?? []) as unknown as PillarScoreRow[] };
}

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { report?: string };
}) {
  const data = await getAssessment(params.id);
  if (!data || !data.assessment) return notFound();

  const { assessment, pillarScores } = data;
  const tier = (assessment as any).tiers;
  const lowest = pillarScores.reduce(
    (min, p) => (p.section_total < min.section_total ? p : min),
    pillarScores[0]
  );

  const businessName = assessment.contact_business || assessment.contact_name || "Your Business";
  const alreadyPaid = Boolean(assessment.full_report_paid_at);
  const justPaid = searchParams.report === "paid";

  return (
    <main id="grid-results" className="min-h-screen bg-zy-near-black text-white print:bg-white print:text-black">
      <div className="max-w-2xl mx-auto px-6 py-16 print:px-0 print:py-8">

        {/* Header: logo and wordmark */}
        <div className="flex items-center gap-4 mb-12 print:mb-6">
          <img
            src="/zytrion-orb-logo.png"
            alt="Zytrion Infrastructure Group"
            className="w-14 h-14 print:w-10 print:h-10"
          />
          <div>
            <p className="text-lg font-semibold tracking-wide leading-tight">Zytrion Infrastructure Group</p>
            <p className="text-sm text-zy-chrome print:text-gray-600">The Momentum of Business</p>
          </div>
        </div>

        {justPaid && (
          <div className="mb-8 rounded-lg border border-zy-electric bg-zy-electric/10 px-5 py-4 print:hidden">
            <p className="text-sm text-white">
              Payment confirmed. Your Full Report is unlocked below.
            </p>
          </div>
        )}

        <p className="text-zy-light-blue print:text-gray-700 text-sm font-medium tracking-wide uppercase mb-2">
          Your GRID Diagnostic Result
        </p>
        <h1 className="text-2xl font-semibold mb-1">
          {businessName}
        </h1>

        {/* Score circle */}
        <div className="mt-10 flex flex-col items-center">
          <div className="relative w-56 h-56 rounded-full border-[6px] border-zy-electric print:border-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold">{assessment.total_score}</div>
              <div className="text-sm text-zy-chrome print:text-gray-600">out of 80</div>
            </div>
          </div>
          <p className="mt-8 text-2xl font-semibold">{tier?.name}</p>
          <p className="mt-2 text-zy-chrome print:text-gray-700 text-center max-w-md">
            {tier?.one_line_summary}
          </p>
        </div>

        {/* Pillar breakdown */}
        <div className="mt-14 print:mt-8">
          <h2 className="text-lg font-semibold mb-6">Your five pillars</h2>
          <div className="space-y-4">
            {pillarScores.map((p, i) => {
              const isLowest = p === lowest;
              const pct = (p.section_total / 16) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={isLowest ? "text-white print:text-black font-medium" : "text-zy-chrome print:text-gray-700"}>
                      {p.pillars?.pillar_name}
                      {isLowest && (
                        <span className="ml-2 text-xs text-zy-electric print:text-gray-900 uppercase tracking-wide">
                          Weakest link
                        </span>
                      )}
                    </span>
                    <span className="text-zy-chrome print:text-gray-700">{p.section_total} / 16</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 print:bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isLowest ? "bg-zy-electric print:bg-gray-900" : "bg-zy-royal print:bg-gray-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-14 print:mt-8 border border-white/10 print:border-gray-300 rounded-lg p-6 bg-white/[0.02] print:bg-white">
          <p className="text-zy-chrome print:text-gray-800 leading-relaxed">
            Your lowest pillar,{" "}
            <span className="text-white print:text-black font-medium">{lowest.pillars?.pillar_name}</span>,
            is the structural bottleneck to close first. That is the
            single next step, before anything else, since every other
            pillar depends on it holding.
          </p>
        </div>

        {/* Actions: hidden when printing */}
        <div className="mt-10 print:hidden flex flex-col sm:flex-row gap-4">
          <PrintButton />
          <FullReportButton assessmentId={assessment.id} alreadyPaid={alreadyPaid} />
        </div>

        {/* Footer: contact and copyright */}
        <div className="mt-16 pt-8 border-t border-white/10 print:border-gray-300 text-xs text-zy-chrome print:text-gray-600 space-y-1">
          <p className="font-medium text-white print:text-black">Zytrion Infrastructure Group, Inc.</p>
          <p>info@getzytrion.com&nbsp;&nbsp;&nbsp;404-640-6009&nbsp;&nbsp;&nbsp;getzytrion.com</p>
          <p>{'\u00A9'} {new Date().getFullYear()} Zytrion Infrastructure Group, Inc. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
