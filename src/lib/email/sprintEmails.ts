import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSprintBookingEmails(params: {
  clientEmail: string;
  clientName: string;
  slotStart: string;
  bookingLabel?: string;
}) {
  const { clientEmail, clientName, slotStart, bookingLabel } = params;
  const label = bookingLabel || "call";
  const when = new Date(slotStart).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  await resend.emails.send({
    from: "Zytrion Infrastructure Group <info@getzytrion.com>",
    to: clientEmail,
    subject: `Your ${label} is confirmed`,
    text: `${clientName || "Hi"},\n\nYour ${label} is confirmed for ${when}.\n\nZytrion Infrastructure Group\ngetzytrion.com`,
  });

  await resend.emails.send({
    from: "Zytrion Infrastructure Group <info@getzytrion.com>",
    to: "info@getzytrion.com",
    subject: `New booking: ${label}`,
    text: `${clientName || "A client"} (${clientEmail}) booked a ${label} for ${when}.`,
  });
}
