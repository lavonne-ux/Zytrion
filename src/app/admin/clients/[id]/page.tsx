import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminStatus } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminNoteForm from "@/components/AdminNoteForm";
import AdminActionItemRow from "@/components/AdminActionItemRow";

export default async function AdminClientPage(props: { params: Promise<{ id: string }> }) {
  const { user, isAdmin } = await getAdminStatus();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/portal");

  const { id } = await props.params;
  const admin = createAdminClient();

  const { data: client } = await admin
    .from("profiles")
    .select("id, contact_name, business_name, contact_email")
    .eq("id", id)
    .single();

  if (!client) return notFound();

  const { data: bookings } = await admin
    .from("sprint_bookings")
    .select("id, slot_start, status")
    .eq("client_id", id)
    .order("slot_start", { ascending: false });

  const { data: notes } = await admin
    .from("session_notes")
    .select("id, note_text, visible_to_client, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const { data: actionItems } = await admin
    .from("action_items")
    .select("id, description, status, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/admin" className="text-sm text-zy-light-blue underline hover:text-white">
          &larr; All Clients
        </Link>
        <p className="text-zy-light-blue text-lg font-bold tracking-wide uppercase mt-4 mb-1">
          Client
        </p>
        <h1 className="text-2xl font-semibold mb-1">
          {client.contact_name || client.business_name || "Unnamed"}
        </h1>
        <p className="text-sm text-zy-chrome mb-8">{client.contact_email}</p>

        <AdminNoteForm clientId={client.id} />

        <h2 className="text-lg font-semibold mb-4">Action Items</h2>
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] mb-8">
          {!actionItems || actionItems.length === 0 ? (
            <p className="text-sm text-zy-chrome">None yet.</p>
          ) : (
            actionItems.map((item) => (
              <AdminActionItemRow
                key={item.id}
                actionItemId={item.id}
                description={item.description}
                status={item.status}
              />
            ))
          )}
        </div>

        <h2 className="text-lg font-semibold mb-4">Notes</h2>
        <div className="space-y-3 mb-8">
          {!notes || notes.length === 0 ? (
            <p className="text-sm text-zy-chrome">None yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zy-chrome">
                    {new Date(note.created_at).toLocaleDateString(undefined, {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </span>
                  <span className={`text-xs uppercase tracking-wide ${note.visible_to_client ? "text-zy-electric" : "text-zy-chrome/60"}`}>
                    {note.visible_to_client ? "Visible to client" : "Private"}
                  </span>
                </div>
                <p className="text-sm text-white leading-relaxed">{note.note_text}</p>
              </div>
            ))
          )}
        </div>

        <h2 className="text-lg font-semibold mb-4">Bookings</h2>
        <div className="space-y-2">
          {!bookings || bookings.length === 0 ? (
            <p className="text-sm text-zy-chrome">None yet.</p>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="border border-white/10 rounded-lg p-4 bg-white/[0.02] flex items-center justify-between">
                <span className="text-sm text-white">
                  {new Date(b.slot_start).toLocaleString(undefined, {
                    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                  })}
                </span>
                <span className="text-xs text-zy-chrome uppercase tracking-wide">{b.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
