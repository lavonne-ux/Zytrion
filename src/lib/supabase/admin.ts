import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this file from a Client Component.
// This uses the service role key, which bypasses row level security
// entirely. It exists specifically so the free public Diagnostic can be
// submitted and read back without requiring an account first.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
