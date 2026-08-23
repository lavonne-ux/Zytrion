export const SPRINT_TIMEZONE = "America/New_York";
export const WINDOWS = [
  { hourStart: 9, hourEnd: 12 },
  { hourStart: 14, hourEnd: 16 },
];
export const DAYS_OF_WEEK = [2, 4];
export const SLOT_GRID_MINUTES = 30;

// Every bookable thing is 30 minutes, client-facing. A 15-minute buffer
// is held internally after each one, invisible to the client, so
// LaVonne never goes straight from one call into the next.
export const BOOKING_DURATIONS: Record<string, number> = {
  sprint: 30,
  consultation: 30,
};
export const BUFFER_MINUTES = 15;

function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const hour24 = map.hour === "24" ? "00" : map.hour;
  const asUTC = Date.UTC(
    Number(map.year), Number(map.month) - 1, Number(map.day),
    Number(hour24), Number(map.minute), Number(map.second)
  );
  return (asUTC - date.getTime()) / 60000;
}

export function easternWallTimeToUTC(
  year: number, month: number, day: number, hour: number, minute: number
): Date {
  const utcGuess = Date.UTC(year, month, day, hour, minute);
  const offsetMinutes = getTimezoneOffsetMinutes(new Date(utcGuess), SPRINT_TIMEZONE);
  return new Date(utcGuess - offsetMinutes * 60000);
}

export function utcToEasternParts(date: Date): { dayOfWeek: number; hour: number; minute: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: SPRINT_TIMEZONE,
    weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = map.hour === "24" ? 0 : Number(map.hour);
  return { dayOfWeek: weekdayMap[map.weekday], hour, minute: Number(map.minute) };
}

// A candidate is valid only if the client-visible booking itself, not
// the buffer, fits inside one continuous window.
export function isValidEasternSlot(date: Date, durationMinutes: number): boolean {
  const { dayOfWeek, hour, minute } = utcToEasternParts(date);
  if (!DAYS_OF_WEEK.includes(dayOfWeek)) return false;
  if (minute !== 0 && minute !== 30) return false;

  const startTotalMinutes = hour * 60 + minute;
  const endTotalMinutes = startTotalMinutes + durationMinutes;

  return WINDOWS.some((w) => {
    const windowStart = w.hourStart * 60;
    const windowEnd = w.hourEnd * 60;
    return startTotalMinutes >= windowStart && endTotalMinutes <= windowEnd;
  });
}

export function generateCandidateSlots(durationMinutes: number): Date[] {
  const slots: Date[] = [];
  const now = new Date();

  for (let d = 0; d < 28; d++) {
    const day = new Date(now.getTime() + d * 86400000);
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: SPRINT_TIMEZONE, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit",
    });
    const parts = dtf.formatToParts(day);
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dayOfWeek = weekdayMap[map.weekday];
    const year = Number(map.year);
    const month = Number(map.month) - 1;
    const date = Number(map.day);

    if (!DAYS_OF_WEEK.includes(dayOfWeek)) continue;

    for (const w of WINDOWS) {
      for (let h = w.hourStart; h < w.hourEnd; h++) {
        for (let m = 0; m < 60; m += SLOT_GRID_MINUTES) {
          const slot = easternWallTimeToUTC(year, month, date, h, m);
          if (slot <= now) continue;
          if (!isValidEasternSlot(slot, durationMinutes)) continue;
          slots.push(slot);
        }
      }
    }
  }
  return slots.sort((a, b) => a.getTime() - b.getTime());
}

// Two bookings conflict if one starts before the other's end PLUS the
// buffer. The buffer only ever applies to existing, already-confirmed
// bookings, extending how long they block the calendar, it never
// changes what the client sees as the length of their own booking.
export function rangesOverlapWithBuffer(
  candidateStart: Date, candidateEnd: Date,
  existingStart: Date, existingEnd: Date, bufferMinutes: number
): boolean {
  const bufferedExistingEnd = new Date(existingEnd.getTime() + bufferMinutes * 60000);
  const bufferedExistingStart = new Date(existingStart.getTime() - bufferMinutes * 60000);
  return candidateStart < bufferedExistingEnd && bufferedExistingStart < candidateEnd;
}
