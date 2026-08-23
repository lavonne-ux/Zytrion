import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSprintBookingEmails(params: {
  clientEmail: string;
  clientName: string;
  slotStart: string;
}) {
  const { clientEmail, clientName, slotStart } = params;
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
    subject: "Your Sprint kickoff call is confirmed",
    text: `${clientName || "Hi"},\n\nYour Governance Stabilization Sprint kickoff call is confirmed for ${when}.\n\nZytrion Infrastructure Group\ngetzytrion.com`,
  });

  await resend.emails.send({
    from: "Zytrion Infrastructure Group <info@getzytrion.com>",
    to: "info@getzytrion.com",
    subject: "New Sprint kickoff booked",
    text: `${clientName || "A client"} (${clientEmail}) booked a Sprint kickoff call for ${when}.`,
  });
}
