/**
 * src/lib/assessment/fullReportContentBank.ts
 *
 * Assembles the $497 Full Report from pre-approved content blocks,
 * selected by the diagnostic's actual score output. No AI generation
 * at render time. Sourced from the Score Interpretation Guide (V7),
 * the Certification Rubric (V1), and the Enterprise in Motion Manual
 * (Ch. 8, The Governance Equation).
 *
 * Intentionally decoupled from src/lib/assessment/scoring.ts. The
 * results page does not call scoreAssessment() at render time, it
 * re-reads already-stored scores from Supabase. So this module takes
 * plain primitives (totalScore, tierNumber, pillarScores) rather than
 * ScoringResult, matching what page.tsx actually has on hand.
 *
 * STATUS: Money Containment populated across all four severity bands,
 * tested against the live 68/80 run (Money Containment 6/16). Tier 1
 * framing populated. The other four pillars and three tiers return an
 * honest "coming soon" placeholder rather than crashing, so this is
 * safe to wire in now, but the report is NOT complete. Do not treat
 * this as ready for real paying clients until every TODO below is
 * replaced with drafted content.
 */

export type Tier = 1 | 2 | 3 | 4;
export type SeverityBand = 'critical' | 'weak' | 'developing' | 'strong';

export interface PillarScoreInput {
  pillarName: string;
  score: number;
}

type PillarKey =
  | 'authorityClarity'
  | 'responsibilityOwnership'
  | 'moneyContainment'
  | 'evidenceIntegrity'
  | 'governanceDiscipline';

const PILLAR_NAME_TO_KEY: Record<string, PillarKey> = {
  'Authority Clarity': 'authorityClarity',
  'Responsibility Ownership': 'responsibilityOwnership',
  'Money Containment': 'moneyContainment',
  'Evidence Integrity': 'evidenceIntegrity',
  'Governance Discipline': 'governanceDiscipline',
};

// Each pillar's flow, from the Governance Equation (Manual Ch. 8).
// Evidence Integrity and Governance Discipline cut across all three
// flows rather than belonging to one, so they map to null.
const PILLAR_FLOW: Record<PillarKey, string | null> = {
  authorityClarity: 'Decision Flow',
  responsibilityOwnership: 'Responsibility Flow',
  moneyContainment: 'Money Flow',
  evidenceIntegrity: null,
  governanceDiscipline: null,
};

/**
 * Certification floor is fixed at 10 of 16 per the Certification
 * Rubric. Bands are built around that floor, not even quarters of the
 * scale, so "developing" always means "clears certification but is
 * not yet strong."
 */
export function getSeverityBand(pillarScore: number): SeverityBand {
  if (pillarScore <= 5) return 'critical';
  if (pillarScore <= 9) return 'weak';
  if (pillarScore <= 12) return 'developing';
  return 'strong';
}

interface TierFraming {
  title: string;
  body: string;
}

interface PillarBandContent {
  headline: string;
  body: string;
  evidenceGap: string;
}

interface WeakestPillarAction {
  rootCause: string;
  firstAction: string;
  kit: string;
}

interface TierNextStep {
  step: string;
  product: string;
}

const PLACEHOLDER_BAND: PillarBandContent = {
  headline: 'Detail coming soon',
  body:
    'The full write-up for this pillar at this score level is still being finalized. Your score and tier placement above are accurate and final; this section will be completed shortly.',
  evidenceGap: '',
};

const PLACEHOLDER_ACTION: WeakestPillarAction = {
  rootCause: '',
  firstAction: 'Full guidance for this pillar is being finalized.',
  kit: '',
};

const PLACEHOLDER_TIER: TierFraming = {
  title: '',
  body: 'The detailed write-up for this tier is still being finalized.',
};

const PLACEHOLDER_NEXT_STEP: TierNextStep = { step: '', product: '' };

export const tierFraming: Record<Tier, TierFraming> = {
  1: {
    title: 'Governed / Institution-Ready',
    body:
      'A score in this range places the enterprise in the top tier of governance readiness. Structure, documentation, and controls are consistent enough to withstand lender, investor, or audit scrutiny across most of the business. The priority from here is not foundational repair. It is leverage: maintaining the standard already built, and closing any single pillar that still falls below the certification floor before treating the position as fully institution-ready.',
  },
  2: PLACEHOLDER_TIER, // TODO
  3: PLACEHOLDER_TIER, // TODO
  4: PLACEHOLDER_TIER, // TODO
};

export const pillarContent: Record<PillarKey, Record<SeverityBand, PillarBandContent>> = {
  moneyContainment: {
    critical: {
      headline: 'Money Containment: High Exposure',
      body:
        'At this level, personal and business finances are not meaningfully separated. Spending moves through the business without a documented basis, and there is no resolution governing compensation. This is the fastest way institutional review ends before it starts. A lender or auditor examining ninety days of transaction history at this level would find commingling, undocumented transfers, or both. Nothing else in this report carries weight until this pillar is addressed.',
      evidenceGap:
        'No Financial Rules Sheet in place. No signed Compensation Resolution on file. Personal and business accounts are not fully separated.',
    },
    weak: {
      headline: 'Money Containment: Weak',
      body:
        'Some separation exists, but it will not hold under real scrutiny. Spending may be informally understood rather than documented, and compensation is likely taken without a signed resolution governing amount, frequency, and authorization. A lender or investor reviewing this pillar would find gaps in the transfer trail even where accounts are technically separate.',
      evidenceGap:
        'Financial Rules Sheet may exist but is not consistently enforced. Compensation Resolution missing or outdated. Transfer basis is not documented for every movement between accounts.',
    },
    developing: {
      headline: 'Money Containment: Developing',
      body:
        'The foundation is in place. Accounts are separated and a Compensation Resolution likely exists, but enforcement is inconsistent. A Monthly Financial Review Log may be missing or irregular, which means spending rules exist on paper without evidence they are actively followed. This pillar clears the certification floor but is not yet institution-ready. The fix is discipline, not structure: keep the review log current and treat every threshold as enforced, not optional.',
      evidenceGap:
        'Financial Rules Sheet exists but Monthly Financial Review Logs are incomplete or inconsistent.',
    },
    strong: {
      headline: 'Money Containment: Established',
      body:
        'Financial governance here can withstand real scrutiny. Personal and business finances are fully separated, compensation is governed by a signed resolution, and spending is bound by documented thresholds that are actively enforced and reviewed. This is the standard a lender, investor, or auditor expects to see. Maintain it as is. Revisit it only when the business itself changes in a way that changes who controls money or how it moves: taking on a co-owner or outside investor, converting entity type, opening new accounts or credit lines, adding someone with signing authority, or taking on institutional debt with its own compliance terms. Short of one of those events, the existing structure holds.',
      evidenceGap:
        'None outstanding. Maintain monthly review log discipline and update the Compensation Resolution whenever terms or ownership change.',
    },
  },

  // TODO: same four-band shape, pending Money Containment sign-off.
  authorityClarity: { critical: PLACEHOLDER_BAND, weak: PLACEHOLDER_BAND, developing: PLACEHOLDER_BAND, strong: PLACEHOLDER_BAND },
  responsibilityOwnership: { critical: PLACEHOLDER_BAND, weak: PLACEHOLDER_BAND, developing: PLACEHOLDER_BAND, strong: PLACEHOLDER_BAND },
  evidenceIntegrity: { critical: PLACEHOLDER_BAND, weak: PLACEHOLDER_BAND, developing: PLACEHOLDER_BAND, strong: PLACEHOLDER_BAND },
  governanceDiscipline: { critical: PLACEHOLDER_BAND, weak: PLACEHOLDER_BAND, developing: PLACEHOLDER_BAND, strong: PLACEHOLDER_BAND },
};

export const weakestPillarFirstAction: Record<PillarKey, WeakestPillarAction> = {
  moneyContainment: {
    rootCause:
      'This pillar is produced by running the D.E.D discipline on Money Flow: deciding with authority, executing through documented roles, and recording the trail behind every dollar that moves. A low score here means that motion is not yet running consistently. It is not, at its root, a missing document. It is a missing habit that a document then makes provable.',
    firstAction:
      'Separate accounts completely. Formalize compensation by signed resolution. Document every financial decision and establish spending thresholds that are actually enforced.',
    kit: 'Tier 3 Implementation Kit, Phase 2, or the Tier 4 Stabilization Pack.',
  },
  authorityClarity: PLACEHOLDER_ACTION, // TODO
  responsibilityOwnership: PLACEHOLDER_ACTION, // TODO
  evidenceIntegrity: PLACEHOLDER_ACTION, // TODO
  governanceDiscipline: PLACEHOLDER_ACTION, // TODO
};

export const tierNextStep: Record<Tier, TierNextStep> = {
  1: {
    step:
      'Apply for the Zytrion Governance Readiness Certification. Join Enterprise membership to maintain the standard and access quarterly re-assessment.',
    product: 'Enterprise Membership, $197 per month.',
  },
  2: PLACEHOLDER_NEXT_STEP, // TODO
  3: PLACEHOLDER_NEXT_STEP, // TODO
  4: PLACEHOLDER_NEXT_STEP, // TODO
};

export interface AssembledReport {
  tier: Tier;
  tierFraming: TierFraming;
  pillars: Array<{
    pillarName: string;
    score: number;
    band: SeverityBand;
    content: PillarBandContent;
  }>;
  /** Exact sentence already live on the free results page bottleneck
   *  box, reused here so free and paid copy never diverge. */
  weakestPillarIntro: string;
  weakestPillar: {
    pillarName: string;
    score: number;
    flow: string | null;
    action: WeakestPillarAction;
  };
  nextStep: TierNextStep;
}

export function assembleFullReport(
  totalScore: number,
  tierNumber: Tier,
  pillarScores: PillarScoreInput[]
): AssembledReport {
  const weakest = pillarScores.reduce(
    (min, p) => (p.score < min.score ? p : min),
    pillarScores[0]
  );
  const weakestKey = PILLAR_NAME_TO_KEY[weakest.pillarName];

  const pillars = pillarScores.map((p) => {
    const key = PILLAR_NAME_TO_KEY[p.pillarName];
    const band = getSeverityBand(p.score);
    return {
      pillarName: p.pillarName,
      score: p.score,
      band,
      content: pillarContent[key][band],
    };
  });

  return {
    tier: tierNumber,
    tierFraming: tierFraming[tierNumber],
    pillars,
    weakestPillarIntro: `Your lowest pillar, ${weakest.pillarName}, is the structural bottleneck to close first. That is the single next step, before anything else, since every other pillar depends on it holding.`,
    weakestPillar: {
      pillarName: weakest.pillarName,
      score: weakest.score,
      flow: PILLAR_FLOW[weakestKey],
      action: weakestPillarFirstAction[weakestKey],
    },
    nextStep: tierNextStep[tierNumber],
  };
}
