import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSprintBookingEmails } from "@/lib/email/sprintEmails";
import { isValidEasternSlot, rangesOverlapWithBuffer, BOOKING_DURATIONS, BUFFER_MINUTES } from "@/lib/sprintAvailability";
import { createCalendarEvent } from "@/lib/calendar/outlookCalendar";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to book." }, { status: 401 });
  }
  const body = await req.json();
  const { enrollmentId, slotStart } = body ?? {};
  if (!enrollmentId || !slotStart) {
    return NextResponse.json({ error: "Missing enrollment or time slot." }, { status: 400 });
  }

  // Duration is derived server-side from the enrollment's actual kit
  // type, never trusted from client input, so what the client sees on
  // the availability screen and what gets enforced here can never
  // disagree.
  const { data: enrollment } = await supabase
    .from("client_kit_enrollments")
    .select("id, client_id, kits ( title, kit_type )")
    .eq("id", enrollmentId)
    .eq("client_id", user.id)
    .single();
  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }

  const kitType = (enrollment as any).kits?.kit_type ?? "sprint";
  const kitTitle = (enrollment as any).kits?.title ?? "Session";
  const durationMinutes = BOOKING_DURATIONS[kitType];
  if (!durationMinutes) {
    return NextResponse.json({ error: "This kit type is not bookable." }, { status: 400 });
  }

  const slotDate = new Date(slotStart);
  if (isNaN(slotDate.getTime()) || !isValidEasternSlot(slotDate, durationMinutes)) {
    return NextResponse.json({ error: "That time is outside available hours." }, { status: 400 });
  }
  if (slotDate <= new Date()) {
    return NextResponse.json({ error: "That time has already passed." }, { status: 400 });
  }

  const slotEnd = new Date(slotDate.getTime() + durationMinutes * 60000);

  // Buffer-aware overlap check, read through the admin client on purpose.
  // Through the RLS-bound client this saw only the caller's own bookings,
  // so it could never detect a clash with another client and two people
  // could take the same slot. Only times are read, no identities.
  //
  // This check enforces the 15 minute buffer and gives a clean message.
  // It cannot be the only guard, because two requests can both pass it
  // before either inserts, so the database carries an exclusion constraint
  // that makes a true overlap impossible. Both are needed.
  const bookingsView = createAdminClient();
  const { data: existing } = await bookingsView
    .from("sprint_bookings")
    .select("slot_start, slot_end")
    .eq("status", "confirmed");

  const conflict = (existing ?? []).some((b) =>
    rangesOverlapWithBuffer(
      slotDate, slotEnd, new Date(b.slot_start), new Date(b.slot_end), BUFFER_MINUTES
    )
  );
  if (conflict) {
    return NextResponse.json({ error: "That time was just booked by someone else. Please pick another." }, { status: 409 });
  }

  const { data: booking, error } = await supabase
    .from("sprint_bookings")
    .insert({
      enrollment_id: enrollmentId,
      client_id: user.id,
      slot_start: slotDate.toISOString(),
      slot_end: slotEnd.toISOString(),
      status: "confirmed",
    })
    .select("id")
    .single();
  if (error) {
    // 23505 is a unique violation, 23P01 an exclusion violation. The second
    // is what the overlap constraint raises when another booking landed in
    // the same moment between the check above and this insert. Both mean
    // the same thing to the person booking.
    if (error.code === "23505" || error.code === "23P01") {
      return NextResponse.json({ error: "That time was just booked by someone else. Please pick another." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not create the booking." }, { status: 500 });
  }

  const clientName = (user.user_metadata as any)?.contact_name ?? "";

  await sendSprintBookingEmails({
    clientEmail: user.email ?? "",
    clientName,
    slotStart: slotDate.toISOString(),
    bookingLabel: kitTitle,
  }).catch(() => {});

  try {
    const eventId = await createCalendarEvent({
      summary: `${kitTitle}: ${clientName || user.email}`,
      description: `Booked via the Zytrion portal.`,
      startTime: slotDate.toISOString(),
      endTime: slotEnd.toISOString(),
    });
    if (eventId && booking?.id) {
      await supabase
        .from("sprint_bookings")
        .update({ calendar_event_id: eventId })
        .eq("id", booking.id);
    }
  } catch {
    // Already logged inside createCalendarEvent.
  }

  return NextResponse.json({ success: true });
}
