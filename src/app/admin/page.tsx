import { redirect } from "next/navigation";
import { getAdminStatus } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import ReviewDecisionButtons from "@/components/ReviewDecisionButtons";

export default async function AdminPage() {
  const { user, isAdmin } = await getAdminStatus();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin) {
    redirect("/portal");
  }

  const admin = createAdminClient();
  const { data: queue } = await admin
    .from("client_phase_progress")
    .select(
      "id, status, evidence_artifact_ref, completed_at, review_status, profiles ( contact_name, contact_email ), kit_phases ( title, phase_number, kits ( title ) )"
    )
    .eq("status", "complete")
    .eq("review_status", "pending")
    .order("completed_at");

  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-zy-light-blue text-lg font-bold tracking-wide uppercase mb-1">
          Admin
        </p>
        <h1 className="text-2xl font-semibold mb-6">Review Queue</h1>

        {!queue || queue.length === 0 ? (
          <div className="border border-white/10 rounded-lg p-8 bg-white/[0.02] text-center">
            <p className="text-white font-medium mb-2">Nothing waiting on review</p>
            <p className="text-sm text-zy-chrome leading-relaxed">
              Every completed phase with evidence attached will show up here
              the moment a client submits one.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((item: any) => (
              <div key={item.id} className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
                <p className="text-xs text-zy-chrome/70 uppercase tracking-wide mb-1">
                  {item.kit_phases?.kits?.title}, Phase {item.kit_phases?.phase_number}
                </p>
                <h3 className="text-white font-semibold mb-1">{item.kit_phases?.title}</h3>
                <p className="text-sm text-zy-chrome mb-3">
                  {item.profiles?.contact_name} ({item.profiles?.contact_email})
                </p>
                <div className="border border-white/10 rounded-md p-4 bg-white/[0.02]">
                  <p className="text-xs text-zy-chrome/70 uppercase tracking-wide mb-1">
                    Submitted Evidence
                  </p>
                  <p className="text-sm text-white">
                    {item.evidence_artifact_ref?.note ?? "No note recorded."}
                  </p>
                </div>
                <ReviewDecisionButtons progressId={item.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
