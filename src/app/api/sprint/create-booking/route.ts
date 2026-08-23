import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSprintBookingEmails } from "@/lib/email/sprintEmails";
import { isValidEasternSlot } from "@/lib/sprintAvailability";

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
  const slotDate = new Date(slotStart);
  if (isNaN(slotDate.getTime()) || !isValidEasternSlot(slotDate)) {
    return NextResponse.json({ error: "That time is outside available Sprint hours." }, { status: 400 });
  }
  if (slotDate <= new Date()) {
    return NextResponse.json({ error: "That time has already passed." }, { status: 400 });
  }
  const { data: enrollment } = await supabase
    .from("client_kit_enrollments")
    .select("id, client_id")
    .eq("id", enrollmentId)
    .eq("client_id", user.id)
    .single();
  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }
  const slotEnd = new Date(slotDate.getTime() + 30 * 60000);
  const { error } = await supabase.from("sprint_bookings").insert({
    enrollment_id: enrollmentId,
    client_id: user.id,
    slot_start: slotDate.toISOString(),
    slot_end: slotEnd.toISOString(),
    status: "confirmed",
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That time was just booked by someone else. Please pick another." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not create the booking." }, { status: 500 });
  }
  await sendSprintBookingEmails({
    clientEmail: user.email ?? "",
    clientName: (user.user_metadata as any)?.contact_name ?? "",
    slotStart: slotDate.toISOString(),
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
