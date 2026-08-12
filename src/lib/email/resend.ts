import { Resend } from "resend";

let client: Resend | null = null;

/**
 * Lazy-loaded, same defensive pattern as the Stripe client (Build 6):
 * a missing RESEND_API_KEY must never fail the build or crash a route.
 * It just means email does not send yet. Callers check for null and
 * skip sending, they never assume a client exists.
 */
export function getResendClient(): Resend | null {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY is not set. Email will not send.");
    return null;
  }
  client = new Resend(key);
  return client;
}

export const EMAIL_FROM = "Zytrion Infrastructure Group <info@getzytrion.com>";

// Where founder purchase notifications land. Same inbox already
// established for Zytrion. Change here if that should be different.
export const FOUNDER_EMAIL = "info@getzytrion.com";
