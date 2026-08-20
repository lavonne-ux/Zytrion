// ============================================================================
// Zytrion :: Live Stripe Product and Price Setup
// Creates every SKU on the confirmed pricing ladder as real Stripe Products
// and Prices. Run once against the LIVE secret key. Safe to re-run against a
// fresh key (e.g. if you ever rotate accounts) since it always creates new
// objects rather than mutating existing ones; it does not check for
// duplicates, so do not run it twice against the same account without
// checking the Product catalog first.
// ============================================================================

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function createProduct(name, description, unitAmountCents, opts = {}) {
  const product = await stripe.products.create({
    name,
    description,
    metadata: opts.metadata || {},
  });

  const priceParams = {
    product: product.id,
    unit_amount: unitAmountCents,
    currency: "usd",
  };
  if (opts.recurring) {
    priceParams.recurring = { interval: opts.recurring };
  }
  const price = await stripe.prices.create(priceParams);

  const dollars = (unitAmountCents / 100).toFixed(2);
  const cadence = opts.recurring ? `/${opts.recurring}` : " one-time";
  console.log(`${name.padEnd(42)} product=${product.id}  price=${price.id}  $${dollars}${cadence}`);

  return { product, price };
}

async function main() {
  console.log("Creating Zytrion live pricing ladder...\n");

  await createProduct(
    "Full Report",
    "Personalized pillar analysis, gap identification, tier-specific remediation roadmap.",
    49700
  );

  await createProduct(
    "Tier 4 Stabilization Pack",
    "14-Day Protocol. Entry-level structured remediation for the least-ready tier.",
    99700
  );

  await createProduct(
    "Tier 3 Implementation Kit - Standard",
    "60-day, five-phase remediation plan.",
    299700
  );
  await createProduct(
    "Tier 3 Implementation Kit - Extended",
    "60-day, five-phase remediation plan, extended support.",
    499700
  );

  await createProduct(
    "Tier 2 Implementation Kit",
    "90-day, five-phase remediation plan.",
    399700
  );

  await createProduct(
    "Tier 1 Implementation Kit",
    "Institution-readiness protocol for near-governed enterprises.",
    499700
  );

  await createProduct(
    "Governance Stabilization Sprint - Standard",
    "28-day advisor-guided implementation with founder oversight checkpoints.",
    799700
  );
  await createProduct(
    "Governance Stabilization Sprint - Extended",
    "45-day advisor-guided implementation with certification eligibility.",
    1499700
  );

  await createProduct(
    "Zytrion Membership - Standard",
    "Quarterly reassessment and ongoing governance maintenance.",
    4700,
    { recurring: "month" }
  );
  await createProduct(
    "Zytrion Membership - Pro",
    "Quarterly reassessment, governance maintenance, priority support.",
    9700,
    { recurring: "month" }
  );
  await createProduct(
    "Zytrion Membership - Enterprise",
    "Quarterly reassessment, governance maintenance, full institutional support.",
    19700,
    { recurring: "month" }
  );

  console.log("\nDone. Copy the price_... IDs above into your checkout session code.");
}

main().catch((err) => {
  console.error("Stripe product creation failed:", err.message);
  process.exit(1);
});
