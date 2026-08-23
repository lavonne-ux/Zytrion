import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCandidateSlots, rangesOverlapWithBuffer, BOOKING_DURATIONS, BUFFER_MINUTES } from "@/lib/sprintAvailability";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") ?? "sprint";
  const durationMinutes = BOOKING_DURATIONS[kind];

  if (!durationMinutes) {
    return NextResponse.json({ error: "Unknown booking type." }, { status: 400 });
  }

  const supabase = await createClient();
  const candidates = generateCandidateSlots(durationMinutes);
  const rangeStart = candidates[0]?.toISOString();
  const lastCandidateEnd = candidates.length
    ? new Date(candidates[candidates.length - 1].getTime() + (durationMinutes + BUFFER_MINUTES) * 60000).toISOString()
    : undefined;

  const { data: existing, error } = await supabase
    .from("sprint_bookings")
    .select("slot_start, slot_end")
    .eq("status", "confirmed")
    .gte("slot_start", rangeStart)
    .lte("slot_start", lastCandidateEnd);

  if (error) {
    return NextResponse.json({ error: "Could not load availability." }, { status: 500 });
  }

  const existingRanges = (existing ?? []).map((b) => ({
    start: new Date(b.slot_start),
    end: new Date(b.slot_end),
  }));

  const available = candidates.filter((slot) => {
    const slotEnd = new Date(slot.getTime() + durationMinutes * 60000);
    return !existingRanges.some((b) =>
      rangesOverlapWithBuffer(slot, slotEnd, b.start, b.end, BUFFER_MINUTES)
    );
  });

  return NextResponse.json({ slots: available.map((s) => s.toISOString()), durationMinutes });
}
