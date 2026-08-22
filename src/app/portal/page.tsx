import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

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
    .select("id, kit_id, status, current_phase, started_at")
    .eq("client_id", user.id);

  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-zy-light-blue text-sm font-medium tracking-wide uppercase mb-1">
              Kit Portal
            </p>
            <h1 className="text-2xl font-semibold">
              Welcome, {profile?.contact_name || user.email}
            </h1>
          </div>
          <SignOutButton />
        </div>

        {enrollments && enrollments.length > 0 ? (
          <div className="space-y-4">
            {enrollments.map((e) => (
              <div key={e.id} className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
                <p className="text-white font-medium">Kit enrollment</p>
                <p className="text-sm text-zy-chrome mt-1">
                  Status: {e.status}, currently on phase {e.current_phase}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-white/10 rounded-lg p-8 bg-white/[0.02] text-center">
            <p className="text-white font-medium mb-2">No active kit yet</p>
            <p className="text-sm text-zy-chrome leading-relaxed">
              Once you purchase an Implementation Kit, it will appear here
              along with your current phase and progress.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
