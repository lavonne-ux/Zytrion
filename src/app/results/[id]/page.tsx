// src/app/results/[id]/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";
import FullReportButton from "./FullReportButton";
import { PILLAR_DESCRIPTIONS } from "@/lib/assessment/pillarDescriptions";
import { assembleFullReport } from "@/lib/assessment/fullReportContentBank";
import Stripe from "stripe";

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

async function verifyPaymentIfNeeded(
  assessmentId: string,
  sessionId: string | undefined,
  alreadyPaid: boolean
): Promise<boolean> {
  if (alreadyPaid || !sessionId) return alreadyPaid;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid" && session.metadata?.assessmentId === assessmentId) {
      const supabase = createAdminClient();
      await supabase
        .from("assessments")
        .update({
          full_report_paid_at: new Date().toISOString(),
          stripe_checkout_session_id: session.id,
        })
        .eq("id", assessmentId);
      return true;
    }
  } catch {
    // Falls through to false; the webhook remains the source of truth if this check fails.
  }

  return alreadyPaid;
}

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { report?: string; session_id?: string };
}) {
  const data = await getAssessment(params.id);
  if (!data || !data.assessment) return notFound();

  const { assessment, pillarScores } = data;
  const tier = (assessment as any).tiers;
  const lowest = pillarScores.reduce(
    (min, p) => (p.section_total < min.section_total ? p : min),
    pillarScores[0]
  );
  const lowestName = lowest.pillars?.pillar_name ?? "";
  const lowestDescription = PILLAR_DESCRIPTIONS[lowestName] ?? "";

  // Certification Rubric standard: no pillar below 10/16 qualifies for Tier 1,
  // even when the total score alone would land in the 65-80 range.
  const hasCriticalPillarGap = tier?.tier_number === 1 && lowest.section_total < 10;

  const businessName = assessment.contact_business || assessment.contact_name || "Your Business";
  const initiallyPaid = Boolean(assessment.full_report_paid_at);
  const alreadyPaid = await verifyPaymentIfNeeded(assessment.id, searchParams.session_id, initiallyPaid);
  const justPaid = searchParams.report === "paid";

  // Full Report content, assembled only when unlocked. Uses the same
  // pillarScores and tier already fetched above, no second query, no
  // re-scoring. Money Containment and Tier 1 are drafted; every other
  // combination currently renders an honest "coming soon" placeholder
  // rather than breaking, but the report is not complete end to end
  // yet, see fullReportContentBank.ts before treating this as launch-ready.
  const fullReport =
    alreadyPaid && tier?.tier_number
      ? assembleFullReport(
          assessment.total_score,
          tier.tier_number,
          pillarScores.map((p) => ({
            pillarName: p.pillars?.pillar_name ?? "",
            score: p.section_total,
          }))
        )
      : null;

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

          {hasCriticalPillarGap && (
            <div className="mt-6 max-w-md rounded-lg border border-amber-400/40 bg-amber-400/5 px-5 py-4 print:border-gray-400 print:bg-white">
              <p className="text-sm text-amber-200 print:text-gray-800 leading-relaxed">
                Your total score places you in {tier?.name}, but {lowestName}{" "}
                scored low enough on its own to still create real risk with a
                lender, investor, or auditor. A strong total score does not
                offset one critically weak pillar. Resolve {lowestName} before
                treating this position as fully institution-ready.
              </p>
            </div>
          )}
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
            <span className="text-white print:text-black font-medium">{lowestName}</span>,
            is the structural bottleneck to close first. That is the
            single next step, before anything else, since every other
            pillar depends on it holding.
          </p>
          {lowestDescription && (
            <p className="mt-4 text-zy-chrome print:text-gray-700 leading-relaxed text-sm border-t border-white/10 print:border-gray-300 pt-4">
              {lowestDescription}
            </p>
          )}
        </div>

        {/* Actions: hidden when printing */}
        <div className="mt-10 print:hidden flex flex-col sm:flex-row gap-4">
          <PrintButton />
          <FullReportButton assessmentId={assessment.id} alreadyPaid={alreadyPaid} />
        </div>

        {/* Full Report: renders only when unlocked. In-portal only, never
            downloadable, per the Platform Build Specification. This is
            new content, additive to everything above, not a replacement
            for the free bottleneck box. */}
        {fullReport && (
          <div className="mt-14 print:mt-8">
            <h2 className="text-lg font-semibold mb-6">Your Full Report</h2>

            {/* Tier framing */}
            <div className="rounded-lg border border-white/10 print:border-gray-300 p-6 bg-white/[0.02] print:bg-white mb-8">
              <p className="text-sm uppercase tracking-wide text-zy-light-blue print:text-gray-700 mb-2">
                {fullReport.tierFraming.title}
              </p>
              <p className="text-zy-chrome print:text-gray-800 leading-relaxed">
                {fullReport.tierFraming.body}
              </p>
            </div>

            {/* Weakest pillar deep dive: root cause and first action */}
            <div className="rounded-lg border border-zy-electric/40 print:border-gray-400 bg-zy-electric/5 print:bg-white p-6 mb-8">
              <p className="text-white print:text-black font-medium mb-3 leading-relaxed">
                {fullReport.weakestPillarIntro}
              </p>
              {fullReport.weakestPillar.action.rootCause && (
                <p className="text-sm text-zy-chrome print:text-gray-700 leading-relaxed mb-4">
                  {fullReport.weakestPillar.action.rootCause}
                </p>
              )}
              <p className="text-sm text-zy-chrome print:text-gray-700 mb-2">
                <span className="text-white print:text-black font-medium">First action: </span>
                {fullReport.weakestPillar.action.firstAction}
              </p>
              {fullReport.weakestPillar.action.kit && (
                <p className="text-sm text-zy-chrome print:text-gray-700">
                  <span className="text-white print:text-black font-medium">Recommended: </span>
                  {fullReport.weakestPillar.action.kit}
                </p>
              )}
            </div>

            {/* Per-pillar deep dive, all five, in score order shown above */}
            <div className="space-y-4">
              {fullReport.pillars.map((p) => (
                <div
                  key={p.pillarName}
                  className="rounded-lg border border-white/10 print:border-gray-300 p-6"
                >
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="font-medium">{p.content.headline}</h3>
                    <span className="text-sm text-zy-chrome print:text-gray-600">{p.score} / 16</span>
                  </div>
                  <p className="text-sm text-zy-chrome print:text-gray-700 leading-relaxed">
                    {p.content.body}
                  </p>
                  {p.content.evidenceGap && (
                    <p className="mt-3 text-xs text-zy-chrome/70 print:text-gray-500 border-t border-white/10 print:border-gray-300 pt-3">
                      Evidence gap: {p.content.evidenceGap}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Next step */}
            {fullReport.nextStep.step && (
              <div className="mt-8 rounded-lg border border-white/10 print:border-gray-300 p-6">
                <p className="text-sm text-zy-chrome print:text-gray-700 leading-relaxed">
                  {fullReport.nextStep.step}
                </p>
                {fullReport.nextStep.product && (
                  <p className="mt-2 text-sm font-medium">{fullReport.nextStep.product}</p>
                )}
              </div>
            )}
          </div>
        )}

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
