import { createClient } from "@/lib/supabase/server";

// Small trust line for the hero CTA. Gated on a live count so it
// never claims traction that doesn't exist yet, but the number
// itself is left out since StatStrip already displays it below.
export default async function FounderCount() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("public_proof_stats")
    .select("stat_value")
    .eq("stat_key", "assessments_completed")
    .maybeSingle();

  if (error || !data?.stat_value) {
    return null;
  }

  const count = Number(data.stat_value);
  if (!count || count <= 0) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-zy-chrome/70">
      Join the founders who&apos;ve already run their GRID.
    </p>
  );
}
