import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

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

  const businessName = assessment.contact_business || assessment.contact_name || "Your Business";
  const contactName = assessment.contact_name || "";
  const mailSubject = encodeURIComponent(`Full Report Request for ${businessName}`);
  const mailBody = encodeURIComponent(
    `Hello Zytrion,\n\nI just completed the GRID Diagnostic and would like my full report.\n\nName: ${contactName}\nBusiness: ${businessName}\nScore: ${assessment.total_score} / 80\nTier: ${tier?.name ?? ""}\n\nThank you.`
  );
  const fullReportHref = `mailto:info@getzytrion.com?subject=${mailSubject}&body=${mailBody}`;

  return (
    <main id="grid-results" className="min-h-screen bg-zy-near-black text-white print:bg-white print:text-black">
      <div className="max-w-2xl mx-auto px-6 py-16 print:px-0 print:py-8">

        {/* Header: logo and wordmark */}
        <div className="flex items-center gap-3 mb-10 print:mb-6">
          <svg width="40" height="40" viewBox="0 0 100 100" className="print:hidden" aria-hidden="true">
            <defs>
              <radialGradient id="zyOrb" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#4AB3E8" />
                <stop offset="45%" stopColor="#1565FF" />
                <stop offset="100%" stopColor="#0B3DBF" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="34" fill="url(#zyOrb)" />
            <ellipse cx="50" cy="50" rx="44" ry="16" fill="none" stroke="#C7CDD6" strokeWidth="2.5" transform="rotate(30 50 50)" opacity="0.85" />
            <ellipse cx="50" cy="50" rx="44" ry="16" fill="none" stroke="#C7CDD6" strokeWidth="2.5" transform="rotate(-30 50 50)" opacity="0.85" />
          </svg>
          <svg width="40" height="40" viewBox="0 0 100 100" className="hidden print:block" aria-hidden="true">
            <circle cx="50" cy="50" r="34" fill="none" stroke="#0A0F2E" strokeWidth="3" />
            <ellipse cx="50" cy="50" rx="44" ry="16" fill="none" stroke="#0A0F2E" strokeWidth="2" transform="rotate(30 50 50)" />
            <ellipse cx="50" cy="50" rx="44" ry="16" fill="none" stroke="#0A0F2E" strokeWidth="2" transform="rotate(-30 50 50)" />
          </svg>
          <div>
            <p className="text-sm font-semibold tracking-wide">Zytrion Infrastructure Group</p>
            <p className="text-xs text-zy-chrome print:text-gray-600">The Momentum of Business</p>
          </div>
        </div>

        <p className="text-zy-light-blue print:text-gray-700 text-sm font-medium tracking-wide uppercase mb-2">
          Your GRID Diagnostic Result
        </p>
        <h1 className="text-2xl font-semibold mb-1">
          {businessName}
        </h1>

        {/* Score circle */}
        <div className="mt-10 flex flex-col items-center">
          <div className="relative w-40 h-40 rounded-full border-4 border-zy-electric print:border-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-semibold">{assessment.total_score}</div>
              <div className="text-xs text-zy-chrome print:text-gray-600">out of 80</div>
            </div>
          </div>
          <p className="mt-6 text-xl font-medium">{tier?.name}</p>
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
          <a
            href={fullReportHref}
            className="inline-flex items-center justify-center rounded-lg border border-zy-electric px-5 py-3 text-sm font-medium text-white hover:bg-zy-electric/10 transition"
          >
            Get Your Full Report
          </a>
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
