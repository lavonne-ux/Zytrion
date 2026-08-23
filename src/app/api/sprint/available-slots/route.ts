import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const WINDOWS = [
  { hourStart: 9, hourEnd: 12 },
  { hourStart: 14, hourEnd: 16 },
];
const DAYS_OF_WEEK = [2, 4];
const WEEKS_AHEAD = 4;
const SLOT_MINUTES = 30;

function generateCandidateSlots(): Date[] {
  const slots: Date[] = [];
  const now = new Date();
  for (let d = 0; d < WEEKS_AHEAD * 7; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    if (!DAYS_OF_WEEK.includes(day.getDay())) continue;
    for (const w of WINDOWS) {
      for (let h = w.hourStart; h < w.hourEnd; h++) {
        for (let m = 0; m < 60; m += SLOT_MINUTES) {
          const slot = new Date(day);
          slot.setHours(h, m, 0, 0);
          if (slot > now) slots.push(slot);
        }
      }
    }
  }
  return slots;
}

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
