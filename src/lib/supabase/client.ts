import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client.
// Uses the public anon key only. Every table this touches must have
// row level security enforced, per the Platform Build Specification.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
