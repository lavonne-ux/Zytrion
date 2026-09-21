import { createAdminClient } from "@/lib/supabase/admin";

// Who is allowed to submit which phase, decided on the server.
//
// Until this existed, any signed-in account could post to the phase
// submission routes with any kit_phase_id and it was written straight
// through. Two things followed from that, and both were reachable without
// any intent to cheat, simply by opening a later phase first:
//
//   1. A client could complete the final phase of a kit having done none
//      of the earlier ones. The final phase sets the enrollment to
//      "complete", so the record then said the engagement was finished.
//      For a company that sells provable governance, a kit that reports
//      itself complete without the work behind it is the worst thing the
//      portal can get wrong.
//
//   2. Nothing checked enrollment at all. An account that had bought
//      nothing could submit work against any kit in the catalogue and
//      appear in the review queue as a client.
//
// The kits run in order by design: each phase produces the evidence the
// next one is built on. This enforces that order at the only point that
// matters, the write.
export type PhaseAccess =
  | { allowed: true; kitId: string; phaseNumber: number }
  | { allowed: false; status: number; error: string };

export async function checkPhaseAccess(
  userId: string,
  kitPhaseId: string
): Promise<PhaseAccess> {
  const admin = createAdminClient();

  const { data: phase } = await admin
    .from("kit_phases")
    .select("id, kit_id, phase_number, title")
    .eq("id", kitPhaseId)
    .maybeSingle();

  if (!phase) {
    return {
      allowed: false,
      status: 404,
      error: "That phase could not be found.",
    };
  }

  // A completed enrollment still counts. A client who finished a kit may
  // legitimately go back and resubmit an earlier phase, and locking them
  // out of their own finished work would be its own bug.
  const { data: enrollments } = await admin
    .from("client_kit_enrollments")
    .select("id, status")
    .eq("client_id", userId)
    .eq("kit_id", phase.kit_id)
    .in("status", ["active", "complete"])
    .limit(1);

  if (!enrollments || enrollments.length === 0) {
    return {
      allowed: false,
      status: 403,
      error:
        "You are not enrolled in the kit this phase belongs to. If you have just purchased it, refresh your portal and try again.",
    };
  }

  // A phase the client has already completed stays open to them. They
  // passed this check to get it, and a client revising work they have
  // already submitted is normal. The gate exists to stop new phases being
  // opened out of order, not to strand records that already exist.
  const { data: own } = await admin
    .from("client_phase_progress")
    .select("status")
    .eq("client_id", userId)
    .eq("kit_phase_id", kitPhaseId)
    .maybeSingle();

  if (own?.status === "complete") {
    return { allowed: true, kitId: phase.kit_id, phaseNumber: phase.phase_number };
  }

  const { data: earlier } = await admin
    .from("kit_phases")
    .select("id, phase_number, title")
    .eq("kit_id", phase.kit_id)
    .lt("phase_number", phase.phase_number)
    .order("phase_number");

  if (!earlier || earlier.length === 0) {
    return { allowed: true, kitId: phase.kit_id, phaseNumber: phase.phase_number };
  }

  const { data: progress } = await admin
    .from("client_phase_progress")
    .select("kit_phase_id, status, review_status")
    .eq("client_id", userId)
    .in(
      "kit_phase_id",
      earlier.map((p) => p.id)
    );

  const byPhase = new Map(
    (progress ?? []).map((row) => [row.kit_phase_id, row])
  );

  for (const p of earlier) {
    const row = byPhase.get(p.id);

    if (!row || row.status !== "complete") {
      return {
        allowed: false,
        status: 409,
        error: `Phase ${p.phase_number}, ${p.title}, has to be submitted before this one. The kit runs in order because each phase produces the evidence the next one is built on.`,
      };
    }

    // A phase awaiting review does not hold up the next one. Review is a
    // person's queue and its speed is not the client's problem, so a
    // pending phase lets the work continue. A phase a person has actively
    // sent back is different: a human judged that work wrong, and anything
    // built on top of it inherits the same problem.
    if (row.review_status === "needs_revision") {
      return {
        allowed: false,
        status: 409,
        error: `Phase ${p.phase_number}, ${p.title}, was sent back for revision. Update that phase and submit it again before continuing here.`,
      };
    }
  }

  return { allowed: true, kitId: phase.kit_id, phaseNumber: phase.phase_number };
}
