// Server-side verification of a Cloudflare Turnstile token.
//
// The governing decision here is what happens when the check cannot be
// completed rather than when it fails. Blocking a founder halfway through
// a fifteen minute Diagnostic costs a client. Letting a script through
// costs roughly fifty database rows and two emails. Those are not the same
// size of mistake, so this errs toward letting people finish.
//
// What that means precisely:
//
//   token present, Cloudflare says valid    -> passed
//   token present, Cloudflare says invalid  -> failed   (the real bot signal)
//   token present, Cloudflare unreachable   -> unavailable, allowed through
//   no token at all                         -> missing, see the switch below
//   no secret configured                    -> not_configured, allowed through
//
// A token can be missing for an innocent reason: a corporate proxy or an
// extension blocking challenges.cloudflare.com, in which case the widget
// reports itself unavailable and the person carries on. It can also be
// missing because something posted straight at the API and never loaded a
// page at all, which is the case this exists to stop.
//
// Tonight it allows those through, because no abuse has happened yet and
// the cost of blocking a real founder on launch week is higher. Once real
// traffic has been seen passing cleanly, flip the constant below to true
// and a submission with no token is refused. That is the whole change.
export const BLOCK_WHEN_TOKEN_MISSING = false;

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cloudflare is normally well under a second. Past this, the person has
// waited long enough and the submission proceeds without the check.
const VERIFY_TIMEOUT_MS = 5000;

export type TurnstileOutcome =
  | "passed"
  | "failed"
  | "missing"
  | "unavailable"
  | "not_configured";

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp: string | null
): Promise<TurnstileOutcome> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    // The secret is not set in this environment. Verification is not
    // possible, so it is not pretended: the submission goes through and
    // the log says why, rather than every Diagnostic failing silently
    // because of a missing environment variable.
    console.warn("Turnstile: TURNSTILE_SECRET_KEY is not set, check skipped.");
    return "not_configured";
  }

  if (!token) {
    return "missing";
  }

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteIp) form.append("remoteip", remoteIp);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`Turnstile: verify endpoint returned ${res.status}.`);
      return "unavailable";
    }

    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (data.success) return "passed";

    console.warn(
      `Turnstile: token rejected (${(data["error-codes"] ?? []).join(", ") || "no reason given"}).`
    );
    return "failed";
  } catch (err) {
    // Network error, DNS failure, or the timeout above. Cloudflare being
    // down is not the visitor's problem.
    console.warn("Turnstile: verification could not be reached.", err);
    return "unavailable";
  }
}

// One place that decides, so the rule is not spread across routes.
export function shouldRejectSubmission(outcome: TurnstileOutcome): boolean {
  if (outcome === "failed") return true;
  if (outcome === "missing") return BLOCK_WHEN_TOKEN_MISSING;
  return false;
}
