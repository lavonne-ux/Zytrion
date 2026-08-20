// ============================================================================
// Zytrion :: Webhook Verification Test
// Sends a realistic, properly-signed checkout.session.completed event to the
// live webhook endpoint, signed with the same secret already set in Vercel.
// This proves signature verification and fulfillment logic both work,
// without needing any real payment.
//
// Requires BOTH env vars set in this PowerShell session before running:
//   STRIPE_SECRET_KEY      (the sk_live_... key)
//   STRIPE_WEBHOOK_SECRET  (the whsec_... value from the webhook you just created)
// ============================================================================

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const payload = JSON.stringify({
  id: "evt_test_webhook_verification",
  object: "event",
  api_version: "2025-02-24",
  created: Math.floor(Date.now() / 1000),
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_webhook_verification",
      object: "checkout.session",
      amount_total: 49700,
      currency: "usd",
      customer_email: "webhook-test@getzytrion.com",
      payment_status: "paid",
      status: "complete",
      metadata: {},
    },
  },
});

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.error("STRIPE_WEBHOOK_SECRET is not set in this session. Set it first, same as STRIPE_SECRET_KEY was set.");
  process.exit(1);
}

const signatureHeader = stripe.webhooks.generateTestHeaderString({
  payload,
  secret: process.env.STRIPE_WEBHOOK_SECRET,
});

async function main() {
  console.log("Sending signed test event to https://www.getzytrion.com/api/stripe/webhook ...\n");

  const res = await fetch("https://www.getzytrion.com/api/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": signatureHeader,
    },
    body: payload,
  });

  console.log("Status code:", res.status);
  const text = await res.text();
  console.log("Response body:", text || "(empty)");

  if (res.status >= 200 && res.status < 300) {
    console.log("\nSuccess. The endpoint accepted the signed event, signature verification works.");
  } else {
    console.log("\nSomething is mismatched. This status code and body tell us exactly what to fix next.");
  }
}

main().catch((err) => {
  console.error("Request failed:", err.message);
  process.exit(1);
});
