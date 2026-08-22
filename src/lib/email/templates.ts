const BRAND = {
  nearBlack: "#080C1A",
  chrome: "#C7CDD6",
  electric: "#1565FF",
};

/**
 * Shared shell for every Zytrion transactional email: logo, wordmark,
 * near-black background, and the same footer already live on the
 * results page (contact line, copyright line). All styles are inline
 * because most email clients strip <style> blocks and ignore external
 * CSS entirely.
 */
function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:${BRAND.nearBlack};font-family:Calibri,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.nearBlack};padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:${BRAND.nearBlack};color:#ffffff;">
          <tr>
            <td style="padding:0 24px 32px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;">
                    <img src="https://zytrion.vercel.app/zytrion-orb-logo.png" width="40" height="40" alt="Zytrion Infrastructure Group" style="display:block;" />
                  </td>
                  <td>
                    <div style="font-size:16px;font-weight:600;letter-spacing:0.3px;">Zytrion Infrastructure Group</div>
                    <div style="font-size:12px;color:${BRAND.chrome};">The Momentum of Business</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:40px 24px 0 24px;border-top:1px solid rgba(255,255,255,0.1);">
              <p style="font-size:12px;color:${BRAND.chrome};margin:16px 0 4px 0;">
                <strong style="color:#ffffff;">Zytrion Infrastructure Group, Inc.</strong>
              </p>
              <p style="font-size:12px;color:${BRAND.chrome};margin:0 0 4px 0;">
                info@getzytrion.com &nbsp;&nbsp;&nbsp; 404-640-6009 &nbsp;&nbsp;&nbsp; getzytrion.com
              </p>
              <p style="font-size:12px;color:${BRAND.chrome};margin:0 0 24px 0;">
                &copy; ${new Date().getFullYear()} Zytrion Infrastructure Group, Inc. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background-color:${BRAND.electric};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;margin:24px 0;">${label}</a>`;
}

export interface TierResultNoticeParams {
  contactName: string;
  businessName: string;
  totalScore: number;
  tierName: string;
  resultsUrl: string;
}

/**
 * Sent from the assessment submit route, right after a diagnostic is
 * scored and saved. This is the message that currently does not exist
 * anywhere in the flow, someone finishes the diagnostic and nothing
 * follows up.
 */
export function tierResultNoticeEmail(params: TierResultNoticeParams): {
  subject: string;
  html: string;
} {
  const { contactName, businessName, totalScore, tierName, resultsUrl } = params;
  const body = `
    <p style="font-size:15px;color:#ffffff;line-height:1.6;">Hi ${contactName},</p>
    <p style="font-size:15px;color:${BRAND.chrome};line-height:1.6;">
      Your GRID result for ${businessName} is ready.
    </p>
    <p style="font-size:32px;font-weight:700;color:#ffffff;margin:24px 0 4px 0;">
      ${totalScore} <span style="font-size:16px;font-weight:400;color:${BRAND.chrome};">out of 80</span>
    </p>
    <p style="font-size:18px;font-weight:600;color:#ffffff;margin:0 0 24px 0;">
      ${tierName}
    </p>
    <p style="font-size:15px;color:${BRAND.chrome};line-height:1.6;">
      Your full pillar breakdown, including the weakest structural point to close first, is waiting inside your result.
    </p>
    ${button("View Your Full Result", resultsUrl)}
  `;
  return {
    subject: "Your GRID result Is Ready",
    html: emailShell(body),
  };
}

export interface PaymentReceiptParams {
  contactName: string;
  businessName: string;
  resultsUrl: string;
}

/**
 * Sent from the Stripe webhook on checkout.session.completed. Confirms
 * the charge and links straight to the now-unlocked Full Report.
 */
export function paymentReceiptEmail(params: PaymentReceiptParams): {
  subject: string;
  html: string;
} {
  const { contactName, businessName, resultsUrl } = params;
  const body = `
    <p style="font-size:15px;color:#ffffff;line-height:1.6;">Hi ${contactName},</p>
    <p style="font-size:15px;color:${BRAND.chrome};line-height:1.6;">
      Payment confirmed. Your Full Report for ${businessName} is unlocked and ready inside the Zytrion platform, pillar by pillar detail, the root cause behind your weakest pillar, and your recommended next step.
    </p>
    <p style="font-size:15px;color:${BRAND.chrome};line-height:1.6;">
      Amount charged: $497.00
    </p>
    ${button("View Your Full Report", resultsUrl)}
    <p style="font-size:13px;color:${BRAND.chrome};line-height:1.6;margin-top:24px;">
      Your report lives inside your account and is not delivered as a downloadable file. Return to this link any time to view it.
    </p>
  `;
  return {
    subject: "Your Zytrion Full Report Is Unlocked",
    html: emailShell(body),
  };
}

export interface FounderPurchasePingParams {
  businessName: string;
  contactName: string;
  contactEmail: string;
  totalScore: number;
  tierName: string;
  resultsUrl: string;
}

/**
 * Sent to the founder inbox on the same webhook event as the receipt.
 * Plain and functional, not meant to carry the full brand shell, this
 * one is for LaVonne, not a client.
 */
export function founderPurchasePingEmail(params: FounderPurchasePingParams): {
  subject: string;
  html: string;
} {
  const { businessName, contactName, contactEmail, totalScore, tierName, resultsUrl } = params;
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;font-family:Calibri,Arial,sans-serif;background-color:#ffffff;color:#000000;">
  <p style="font-size:15px;">Full Report purchased, $497.</p>
  <table role="presentation" cellpadding="4" cellspacing="0" style="font-size:14px;">
    <tr><td><strong>Business:</strong></td><td>${businessName}</td></tr>
    <tr><td><strong>Contact:</strong></td><td>${contactName} (${contactEmail})</td></tr>
    <tr><td><strong>Score:</strong></td><td>${totalScore} / 80</td></tr>
    <tr><td><strong>Tier:</strong></td><td>${tierName}</td></tr>
  </table>
  <p style="font-size:14px;margin-top:16px;"><a href="${resultsUrl}">View the result</a></p>
</body>
</html>`;
  return {
    subject: `Full Report Purchased, ${businessName}`,
    html,
  };
}

export interface KitPurchaseReceiptParams {
  contactName: string;
  kitTitle: string;
  amountCents: number;
  portalUrl: string;
}

/**
 * Sent from the Stripe webhook on checkout.session.completed for a
 * kit purchase. Confirms the charge and sends the client straight
 * back into the portal where their new enrollment is now waiting.
 */
export function kitPurchaseReceiptEmail(params: KitPurchaseReceiptParams): {
  subject: string;
  html: string;
} {
  const { contactName, kitTitle, amountCents, portalUrl } = params;
  const amount = (amountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });
  const body = `
    <p style="font-size:15px;color:#ffffff;line-height:1.6;">Hi ${contactName},</p>
    <p style="font-size:15px;color:${BRAND.chrome};line-height:1.6;">
      Payment confirmed. You are enrolled in the ${kitTitle}, and it is waiting for you inside your Zytrion Kit Portal right now.
    </p>
    <p style="font-size:15px;color:${BRAND.chrome};line-height:1.6;">
      Amount charged: $${amount}
    </p>
    ${button("Go to Your Kit Portal", portalUrl)}
  `;
  return {
    subject: `You Are Enrolled: ${kitTitle}`,
    html: emailShell(body),
  };
}

export interface FounderKitPurchasePingParams {
  businessName: string;
  contactName: string;
  contactEmail: string;
  kitTitle: string;
  amountCents: number;
}

/**
 * Sent to the founder inbox on the same webhook event as the kit
 * receipt. Plain and functional, matches founderPurchasePingEmail's
 * style, this one is for LaVonne, not a client.
 */
export function founderKitPurchasePingEmail(params: FounderKitPurchasePingParams): {
  subject: string;
  html: string;
} {
  const { businessName, contactName, contactEmail, kitTitle, amountCents } = params;
  const amount = (amountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;font-family:Calibri,Arial,sans-serif;background-color:#ffffff;color:#000000;">
  <p style="font-size:15px;">${kitTitle} purchased, $${amount}.</p>
  <table role="presentation" cellpadding="4" cellspacing="0" style="font-size:14px;">
    <tr><td><strong>Business:</strong></td><td>${businessName}</td></tr>
    <tr><td><strong>Contact:</strong></td><td>${contactName} (${contactEmail})</td></tr>
  </table>
</body>
</html>`;
  return {
    subject: `${kitTitle} Purchased, ${businessName}`,
    html,
  };
}

export interface PhaseSubmittedForReviewParams {
  contactName: string;
  contactEmail: string;
  kitTitle: string;
  phaseTitle: string;
  phaseNumber: number;
  evidenceNote: string;
  adminUrl: string;
}

/**
 * Sent to the founder inbox the moment a client marks a phase
 * complete with a real evidence note attached. Plain and functional,
 * matches founderKitPurchasePingEmail's style, this one is for
 * LaVonne, not a client.
 */
export function phaseSubmittedForReviewEmail(params: PhaseSubmittedForReviewParams): {
  subject: string;
  html: string;
} {
  const { contactName, contactEmail, kitTitle, phaseTitle, phaseNumber, evidenceNote, adminUrl } = params;
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;font-family:Calibri,Arial,sans-serif;background-color:#ffffff;color:#000000;">
  <p style="font-size:15px;">Phase ${phaseNumber} submitted for review, ${kitTitle}.</p>
  <table role="presentation" cellpadding="4" cellspacing="0" style="font-size:14px;">
    <tr><td><strong>Contact:</strong></td><td>${contactName} (${contactEmail})</td></tr>
    <tr><td><strong>Phase:</strong></td><td>${phaseTitle}</td></tr>
    <tr><td><strong>Evidence:</strong></td><td>${evidenceNote}</td></tr>
  </table>
  <p style="font-size:14px;margin-top:16px;"><a href="${adminUrl}">Open the review queue</a></p>
</body>
</html>`;
  return {
    subject: `Review Needed: ${kitTitle}, Phase ${phaseNumber}`,
    html,
  };
}

export interface PhaseReviewDecisionParams {
  contactName: string;
  kitTitle: string;
  phaseTitle: string;
  decision: "approved" | "needs_revision";
  reviewerNotes: string;
  portalUrl: string;
}

/**
 * Sent to the client the moment their submitted evidence is reviewed,
 * approved or sent back. Carries the full brand shell since this one
 * is client-facing.
 */
export function phaseReviewDecisionEmail(params: PhaseReviewDecisionParams): {
  subject: string;
  html: string;
} {
  const { contactName, kitTitle, phaseTitle, decision, reviewerNotes, portalUrl } = params;
  const isApproved = decision === "approved";
  const body = `
    <p style="font-size:15px;color:#ffffff;line-height:1.6;">Hi ${contactName},</p>
    <p style="font-size:15px;color:${BRAND.chrome};line-height:1.6;">
      ${isApproved
        ? `Your submission for ${phaseTitle}, part of your ${kitTitle}, has been reviewed and approved.`
        : `Your submission for ${phaseTitle}, part of your ${kitTitle}, needs another look before it can be approved.`
      }
    </p>
    ${reviewerNotes ? `<p style="font-size:15px;color:${BRAND.chrome};line-height:1.6;">${reviewerNotes}</p>` : ""}
    ${button("Go to Your Kit Portal", portalUrl)}
  `;
  return {
    subject: isApproved
      ? `Approved: ${phaseTitle}`
      : `Revision Needed: ${phaseTitle}`,
    html: emailShell(body),
  };
}
