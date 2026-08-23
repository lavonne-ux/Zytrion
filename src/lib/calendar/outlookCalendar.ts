import { ConfidentialClientApplication } from "@azure/msal-node";

// Dormant until AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and
// OUTLOOK_MAILBOX exist in the environment. Until then this quietly
// no-ops, bookings still work, they just do not appear on the calendar
// yet. No code changes needed once credentials are added, only
// environment variables and an Azure AD app registration granting
// Calendars.ReadWrite application permission on info@getzytrion.com,
// admin-consented in the Microsoft 365 tenant that owns getzytrion.com.

async function getAccessToken(): Promise<string | null> {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) return null;

  const cca = new ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  });

  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  return result?.accessToken ?? null;
}

export async function createCalendarEvent(params: {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
}): Promise<string | null> {
  const mailbox = process.env.OUTLOOK_MAILBOX;

  if (!mailbox) {
    console.log("Outlook calendar not configured yet, skipping calendar event.");
    return null;
  }

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.log("Outlook calendar credentials not configured yet, skipping calendar event.");
      return null;
    }

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${mailbox}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: params.summary,
          body: { contentType: "Text", content: params.description },
          start: { dateTime: params.startTime, timeZone: "Eastern Standard Time" },
          end: { dateTime: params.endTime, timeZone: "Eastern Standard Time" },
        }),
      }
    );

    if (!response.ok) {
      console.error("Microsoft Graph event creation failed:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.id ?? null;
  } catch (err) {
    console.error("Failed to create Outlook calendar event:", err);
    return null;
  }
}
