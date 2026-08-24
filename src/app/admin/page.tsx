import { redirect } from "next/navigation";
import Link from "next/link";
import Stripe from "stripe";
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

  const { data: clients } = await admin
    .from("profiles")
    .select("id, contact_name, business_name, contact_email")
    .order("contact_name");

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const { data: upcomingBookings } = await admin
    .from("sprint_bookings")
    .select("id, slot_start, client_id, profiles ( contact_name, contact_email ), client_kit_enrollments ( kits ( title ) )")
    .eq("status", "confirmed")
    .gte("slot_start", now.toISOString())
    .order("slot_start")
    .limit(10);

  const { count: activeEnrollmentCount } = await admin
    .from("client_kit_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const { count: weekBookingCount } = await admin
    .from("sprint_bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed")
    .gte("slot_start", now.toISOString())
    .lt("slot_start", weekFromNow.toISOString());

  const { count: recentGridCount } = await admin
    .from("assessments")
    .select("id", { count: "exact", head: true })
    .gte("taken_at", sevenDaysAgo.toISOString());

  const pendingReviewCount = queue?.length ?? 0;

  let availableBalanceCents = 0;
  let revenue30DaysCents = 0;
  let stripeError = false;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const balance = await stripe.balance.retrieve();
    availableBalanceCents = balance.available.reduce((sum, b) => sum + b.amount, 0);

    const thirtyDaysAgoUnix = Math.floor((now.getTime() - 30 * 86400000) / 1000);
    const paymentIntents = await stripe.paymentIntents.list({
      created: { gte: thirtyDaysAgoUnix },
      limit: 100,
    });
    revenue30DaysCents = paymentIntents.data
      .filter((pi) => pi.status === "succeeded")
      .reduce((sum, pi) => sum + pi.amount_received, 0);
  } catch (err) {
    console.error("Stripe dashboard data failed to load:", err);
    stripeError = true;
  }

  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-zy-light-blue text-lg font-bold tracking-wide uppercase mb-1">
          Admin
        </p>
        <h1 className="text-2xl font-semibold mb-8">Dashboard</h1>

        <p className="text-xs text-zy-chrome/70 uppercase tracking-wide mb-3">Live from Stripe</p>
        {stripeError ? (
          <p className="text-sm text-zy-chrome mb-8">Could not load Stripe data right now.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="border border-zy-electric/30 rounded-lg p-4 bg-zy-electric/5">
              <p className="text-2xl font-bold text-zy-electric">
                ${(availableBalanceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-zy-chrome mt-1">Available Balance</p>
            </div>
            <div className="border border-zy-electric/30 rounded-lg p-4 bg-zy-electric/5">
              <p className="text-2xl font-bold text-zy-electric">
                ${(revenue30DaysCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-zy-chrome mt-1">Revenue, Last 30 Days</p>
            </div>
          </div>
        )}

        <p className="text-xs text-zy-chrome/70 uppercase tracking-wide mb-3">Platform</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
            <p className="text-2xl font-bold text-white">{pendingReviewCount}</p>
            <p className="text-xs text-zy-chrome mt-1">Pending Reviews</p>
          </div>
          <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
            <p className="text-2xl font-bold text-white">{weekBookingCount ?? 0}</p>
            <p className="text-xs text-zy-chrome mt-1">Bookings This Week</p>
          </div>
          <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
            <p className="text-2xl font-bold text-white">{activeEnrollmentCount ?? 0}</p>
            <p className="text-xs text-zy-chrome mt-1">Active Enrollments</p>
          </div>
          <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
            <p className="text-2xl font-bold text-white">{recentGridCount ?? 0}</p>
            <p className="text-xs text-zy-chrome mt-1">GRID, Last 7 Days</p>
          </div>
        </div>

        <details open className="mb-10 group">
          <summary className="cursor-pointer list-none flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Upcoming Bookings
              <span className="ml-3 text-sm font-normal text-zy-chrome">
                ({upcomingBookings?.length ?? 0})
              </span>
            </h2>
            <span className="text-zy-chrome text-sm group-open:hidden">Show</span>
            <span className="text-zy-chrome text-sm hidden group-open:inline">Hide</span>
          </summary>
          {!upcomingBookings || upcomingBookings.length === 0 ? (
            <p className="text-sm text-zy-chrome">Nothing scheduled right now.</p>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map((b: any) => (
                <Link
                  key={b.id}
                  href={`/admin/clients/${b.client_id}`}
                  className="flex items-center justify-between border border-white/10 rounded-lg p-4 bg-white/[0.02] hover:border-zy-electric/40 transition-colors"
                >
                  <div>
                    <p className="text-sm text-white font-medium">
                      {b.profiles?.contact_name ?? b.profiles?.contact_email}
                    </p>
                    <p className="text-xs text-zy-chrome mt-1">
                      {b.client_kit_enrollments?.kits?.title ?? "Session"}
                    </p>
                  </div>
                  <p className="text-xs text-zy-chrome text-right">
                    {new Date(b.slot_start).toLocaleString(undefined, {
                      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </details>

        <details open className="mb-12 group">
          <summary className="cursor-pointer list-none flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Review Queue
              <span className="ml-3 text-sm font-normal text-zy-chrome">
                ({pendingReviewCount})
              </span>
            </h2>
            <span className="text-zy-chrome text-sm group-open:hidden">Show</span>
            <span className="text-zy-chrome text-sm hidden group-open:inline">Hide</span>
          </summary>
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
        </details>

        <details className="group">
          <summary className="cursor-pointer list-none flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Clients
              <span className="ml-3 text-sm font-normal text-zy-chrome">
                ({clients?.length ?? 0})
              </span>
            </h2>
            <span className="text-zy-chrome text-sm group-open:hidden">Show</span>
            <span className="text-zy-chrome text-sm hidden group-open:inline">Hide</span>
          </summary>
          <div className="space-y-2">
            {clients?.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="block border border-white/10 rounded-lg p-4 bg-white/[0.02] hover:border-zy-electric/40 transition-colors"
              >
                <p className="text-white font-medium">
                  {client.contact_name || client.business_name || "Unnamed"}
                </p>
                <p className="text-xs text-zy-chrome mt-1">{client.contact_email}</p>
              </Link>
            ))}
          </div>
        </details>
      </div>
    </main>
  );
}
