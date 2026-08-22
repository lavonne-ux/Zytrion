import { redirect } from "next/navigation";
import { getAdminStatus } from "@/lib/auth/admin";

export default async function AdminPage() {
  const { user, isAdmin } = await getAdminStatus();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin) {
    redirect("/portal");
  }

  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-zy-light-blue text-lg font-bold tracking-wide uppercase mb-1">
          Admin
        </p>
        <h1 className="text-2xl font-semibold mb-6">Internal Dashboard</h1>
        <p className="text-zy-chrome">
          Signed in as an admin. This is the foundation the review queue
          and client records get built on next.
        </p>
      </div>
    </main>
  );
}
