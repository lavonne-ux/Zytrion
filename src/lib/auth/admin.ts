import { createClient } from "@/lib/supabase/server";

// Checks whether the currently authenticated user is an admin. Reads
// through the RLS-respecting client, so this only ever reflects the
// real signed-in user's own profile row, never anyone else's. Every
// future admin page and route should call this rather than querying
// is_admin directly, so the check stays identical everywhere.
export async function getAdminStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return { user, isAdmin: profile?.is_admin === true };
}
