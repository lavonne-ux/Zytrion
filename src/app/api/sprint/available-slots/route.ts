import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCandidateSlots } from "@/lib/sprintAvailability";

export async function GET() {
  const supabase = await createClient();
  const candidates = generateCandidateSlots();
  const rangeStart = candidates[0]?.toISOString();
  const rangeEnd = candidates[candidates.length - 1]?.toISOString();

  const { data: booked, error } = await supabase
    .from("sprint_bookings")
    .select("slot_start")
    .eq("status", "confirmed")
    .gte("slot_start", rangeStart)
    .lte("slot_start", rangeEnd);

  if (error) {
    return NextResponse.json({ error: "Could not load availability." }, { status: 500 });
  }

  const bookedTimes = new Set((booked ?? []).map((b) => new Date(b.slot_start).getTime()));
  const available = candidates.filter((slot) => !bookedTimes.has(slot.getTime()));

  return NextResponse.json({ slots: available.map((s) => s.toISOString()) });
}
