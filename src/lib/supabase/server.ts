import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client, used inside Server Components and Server
// Actions. Reads the session from cookies so RLS applies as the signed-in
// user, not the service role.
//
// Async as of Next.js 16: cookies() returns a Promise now that the
// UnsafeUnwrappedCookies transitional escape hatch from the Next.js 15
// period has been removed entirely. Every caller of createClient() must
// now await it.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies directly.
            // Safe to ignore when middleware refreshes the session.
          }
        },
      },
    }
  );
}

// Privileged client for server-only operations that must bypass RLS:
// scoring writes, fulfillment, and the national Zyndex dataset rollups.
// SUPABASE_SERVICE_ROLE_KEY must never be exposed to the browser or
// committed to the repository. Does not touch cookies, unaffected by
// the async change, stays synchronous.
export function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
