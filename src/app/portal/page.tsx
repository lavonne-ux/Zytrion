import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import BuyKitButton from "@/components/BuyKitButton";
import PhaseProgressButton from "@/components/PhaseProgressButton";
import SprintBookingWidget from "@/components/SprintBookingWidget";

type PhaseStatus = "not_started" | "in_progress" | "complete";
type ReviewStatus = "pending" | "approved" | "needs_revision";

type PhaseWithProgress = {
  id: string;
  phase_number: number;
  day_start: number | null;
  day_end: number | null;
  title: string;
  objective: string | null;
  evidence_produced: string | null;
  tools: { tool_name: string; portal_render_type: string; description: string | null } | null;
  status: PhaseStatus;
  reviewStatus: ReviewStatus;
  reviewerNotes: string | null;
};

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("contact_name, business_name, contact_email")
    .eq("id", user.id)
    .single();

  const { data: gridResults } = await supabase
    .from("assessments")
    .select("id, total_score, taken_at, full_report_paid_at, tiers ( name, tier_number )")
    .eq("client_id", user.id)
    .order("taken_at", { ascending: false });

  // All active enrollments, newest first. Previously this only ever read
  // enrollments[0], which silently hid every kit but the first one
  // returned whenever a client had more than one, not just Sprint.
  const { data: enrollments } = await supabase
    .from("client_kit_enrollments")
    .select("id, kit_id, status, current_phase, started_at, kits ( title, kit_type )")
    .eq("client_id", user.id)
    .order("started_at", { ascending: false });

  const allEnrollments = enrollments ?? [];
  const hasActiveKit = allEnrollments.length > 0;

  const enrollmentsWithPhases = await Promise.all(
    allEnrollments.map(async (enrollment: any) => {
      const isSprint = enrollment.kits?.kit_type === "sprint";
      if (isSprint) {
        return { enrollment, isSprint: true, phases: [] as PhaseWithProgress[] };
      }

      const { data: phases } = await supabase
        .from("kit_phases")
        .select(
          "id, phase_number, day_start, day_end, title, objective, evidence_produced, tools ( tool_name, portal_render_type, description )"
        )
        .eq("kit_id", enrollment.kit_id)
        .order("sort_order");

      const { data: progress } = await supabase
        .from("client_phase_progress")
        .select("kit_phase_id, status, review_status, reviewer_notes")
        .eq("client_id", user.id);

      const progressMap = Object.fromEntries(
        (progress ?? []).map((p) => [p.kit_phase_id, p])
      );

      const phasesWithProgress: PhaseWithProgress[] = (phases ?? []).map((p: any) => ({
        ...p,
        status: progressMap[p.id]?.status ?? "not_started",
        reviewStatus: progressMap[p.id]?.review_status ?? "pending",
        reviewerNotes: progressMap[p.id]?.reviewer_notes ?? null,
      }));

      return { enrollment, isSprint: false, phases: phasesWithProgress };
    })
  );

  const { data: kits } = await supabase
    .from("kits")
    .select("id, title, price_standard, price_extended, duration_days, purpose_statement")
    .order("tier_id");

  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-zy-light-blue text-lg font-bold tracking-wide uppercase mb-1">
              Kit Portal
            </p>
            <h1 className="text-2xl font-semibold">
              Welcome, {profile?.contact_name || user.email}
            </h1>
          </div>
          <SignOutButton />
        </div>

        {gridResults && gridResults.length > 0 && (
          <details className="mb-8 border border-white/10 rounded-lg bg-white/[0.02] group">
            <summary className="cursor-pointer list-none px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Your GRID Results
                <span className="ml-3 text-sm font-normal text-zy-chrome">
                  ({gridResults.length})
                </span>
              </h2>
              <span className="text-zy-chrome text-sm group-open:hidden">Show all</span>
              <span className="text-zy-chrome text-sm hidden group-open:inline">Hide</span>
            </summary>
            <div className="px-6 pb-6 space-y-3">
              {gridResults.map((result: any) => (
                
                <a
                  key={result.id}
                  href={`/results/${result.id}`}
                  className="block border border-white/10 rounded-lg p-4 bg-white/[0.02] hover:border-zy-electric/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">
                        {result.tiers?.name ?? "Tier pending"}
                      </p>
                      <p className="text-xs text-zy-chrome mt-1">
                        {new Date(result.taken_at).toLocaleDateString(undefined, {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                        {result.full_report_paid_at ? ", Full Report unlocked" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-zy-electric">{result.total_score}</div>
                      <div className="text-xs text-zy-chrome">/ 80</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </details>
        )}

        {hasActiveKit ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-2">
              Your Kits
              <span className="ml-3 text-sm font-normal text-zy-chrome">
                ({enrollmentsWithPhases.length})
              </span>
            </h2>
            {enrollmentsWithPhases.map(({ enrollment, isSprint, phases }, idx) => (
              <details
                key={enrollment.id}
                open={idx === 0}
                className="border border-white/10 rounded-lg bg-white/[0.02] group"
              >
                <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {(enrollment as any).kits?.title ?? "Your Kit"}
                    </p>
                    <p className="text-sm text-zy-chrome mt-1">
                      Status: {enrollment.status}
                      {!isSprint ? `, currently on phase ${enrollment.current_phase}` : ""}
                    </p>
                  </div>
                  <span className="text-zy-chrome text-sm group-open:hidden">Expand</span>
                  <span className="text-zy-chrome text-sm hidden group-open:inline">Collapse</span>
                </summary>

                <div className="px-6 pb-6">
                  {isSprint ? (
                    <div className="space-y-6">
                      <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
                        <p className="text-white font-semibold text-lg mb-2">
                          Governance Stabilization Sprint
                        </p>
                        <p className="text-sm text-zy-chrome leading-relaxed">
                          A structured, advisor-guided implementation engagement. Not a course, not
                          a consultation. LaVonne works through your governance infrastructure with
                          you, week by week, until it is built, documented, and provable. Your
                          advisor directs the work, reviews what you produce, and holds the
                          standard. You do the work.
                        </p>
                      </div>
                      <SprintBookingWidget enrollmentId={enrollment.id} />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {phases.map((phase) => (
                        <div
                          key={phase.id}
                          className="border border-white/10 rounded-lg p-6 bg-white/[0.02]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-zy-light-blue text-xs font-semibold uppercase tracking-wide">
                              Phase {phase.phase_number}
                              {phase.day_start && phase.day_end
                                ? `, Days ${phase.day_start}\u2013${phase.day_end}`
                                : ""}
                            </p>
                          </div>
                          <h3 className="text-white font-semibold mb-2">{phase.title}</h3>
                          {phase.objective && (
                            <p className="text-sm text-zy-chrome mb-4">{phase.objective}</p>
                          )}
                          {phase.tools && (
                            <div className="border border-white/10 rounded-md p-4 bg-white/[0.02] mb-4">
                              <p className="text-xs text-zy-chrome/70 uppercase tracking-wide mb-1">
                                {phase.tools.portal_render_type}
                              </p>
                              <p className="text-white font-medium mb-1">{phase.tools.tool_name}</p>
                              {phase.tools.description && (
                                <p className="text-sm text-zy-chrome">{phase.tools.description}</p>
                              )}
                            </div>
                          )}
                          <PhaseProgressButton
                            kitPhaseId={phase.id}
                            status={phase.status}
                            reviewStatus={phase.reviewStatus}
                            reviewerNotes={phase.reviewerNotes}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div>
            <div className="border border-white/10 rounded-lg p-8 bg-white/[0.02] text-center mb-10">
              <p className="text-white font-medium mb-2">No active kit yet</p>
              <p className="text-sm text-zy-chrome leading-relaxed">
                Choose the kit that matches where your business is right
                now. Once purchased, it appears here with your phase and
                progress.
              </p>
            </div>

            <div className="space-y-4">
              {kits?.map((kit) => (
                <div key={kit.id} className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
                  <h3 className="text-white font-semibold mb-1">{kit.title}</h3>
                  {kit.purpose_statement && (
                    <p className="text-sm text-zy-chrome mb-4">{kit.purpose_statement}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {kit.price_standard && (
                      <BuyKitButton
                        kitId={kit.id}
                        priceType="standard"
                        label={`Enroll, $${(kit.price_standard / 100).toLocaleString()}`}
                      />
                    )}
                    {kit.price_extended && (
                      <BuyKitButton
                        kitId={kit.id}
                        priceType="extended"
                        label={`Extended, $${(kit.price_extended / 100).toLocaleString()}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
