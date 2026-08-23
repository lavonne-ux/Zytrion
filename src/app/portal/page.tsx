import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import BuyKitButton from "@/components/BuyKitButton";
import PhaseProgressButton from "@/components/PhaseProgressButton";

type PhaseStatus = "not_started" | "in_progress" | "complete";
type ReviewStatus = "pending" | "approved" | "needs_revision";

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

  const { data: enrollments } = await supabase
    .from("client_kit_enrollments")
    .select("id, kit_id, status, current_phase, started_at, kits ( title )")
    .eq("client_id", user.id);

  const hasActiveKit = enrollments && enrollments.length > 0;
  const activeEnrollment = hasActiveKit ? enrollments![0] : null;

  let phasesWithProgress: Array<{
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
  }> = [];

  if (activeEnrollment) {
    const { data: phases } = await supabase
      .from("kit_phases")
      .select(
        "id, phase_number, day_start, day_end, title, objective, evidence_produced, tools ( tool_name, portal_render_type, description )"
      )
      .eq("kit_id", activeEnrollment.kit_id)
      .order("sort_order");

    const { data: progress } = await supabase
      .from("client_phase_progress")
      .select("kit_phase_id, status, review_status, reviewer_notes")
      .eq("client_id", user.id);

    const progressMap = Object.fromEntries(
      (progress ?? []).map((p) => [p.kit_phase_id, p])
    );

    phasesWithProgress = (phases ?? []).map((p: any) => ({
      ...p,
      status: progressMap[p.id]?.status ?? "not_started",
      reviewStatus: progressMap[p.id]?.review_status ?? "pending",
      reviewerNotes: progressMap[p.id]?.reviewer_notes ?? null,
    }));
  }

  const { data: kits } = await supabase
    .from("kits")
    .select("id, title, price_standard, price_extended, duration_days, purpose_statement")
    .order("tier_id");

  const { data: gridResults } = await supabase
    .from("assessments")
    .select("id, total_score, taken_at, full_report_paid_at, tiers ( name, tier_number )")
    .eq("client_id", user.id)
    .order("taken_at", { ascending: false });

  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
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
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-6">Your GRID Results</h2>
            <div className="space-y-4">
              {gridResults.map((result: any) => (
                <a
                  key={result.id}
                  href={`/results/${result.id}`}
                  className="block border border-white/10 rounded-lg p-6 bg-white/[0.02] hover:border-zy-electric/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">
                        {result.tiers?.name ?? "Tier pending"}
                      </p>
                      <p className="text-sm text-zy-chrome mt-1">
                        {new Date(result.taken_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                        {result.full_report_paid_at ? ", Full Report unlocked" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-zy-electric">
                        {result.total_score}
                      </div>
                      <div className="text-xs text-zy-chrome">/ 80</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {activeEnrollment ? (
          <div>
            <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] mb-8">
              <p className="text-white font-semibold text-lg">
                {(activeEnrollment as any).kits?.title ?? "Your Kit"}
              </p>
              <p className="text-sm text-zy-chrome mt-1">
                Status: {activeEnrollment.status}, currently on phase {activeEnrollment.current_phase}
              </p>
            </div>

            <h2 className="text-xl font-semibold text-white mb-6">Your Phases</h2>
            <div className="space-y-4">
              {phasesWithProgress.map((phase) => (
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
