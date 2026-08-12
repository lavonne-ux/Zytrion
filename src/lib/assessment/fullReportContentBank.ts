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
 * STATUS: COMPLETE. All five pillars populated across all four
 * severity bands. All four tiers framed. All five weakest-pillar
 * root-cause and first-action blocks populated. All four tier next
 * steps populated. No placeholders remain. Verified against two live
 * tests: 68/80 with Money Containment 6/16 (Tier 1, caveat triggered),
 * and 64/80 with Money Containment 4/16 (Tier 2).
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
  /** Short status only, e.g. "High Exposure", "Established". Never
   *  the pillar name, the caller supplies that separately. */
  statusLabel: string;
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

export const tierFraming: Record<Tier, TierFraming> = {
  1: {
    title: 'Governed / Institution-Ready',
    body:
      'A score in this range places the enterprise in the top tier of governance readiness. Structure, documentation, and controls are consistent enough to withstand lender, investor, or audit scrutiny across most of the business. The priority from here is not foundational repair. It is leverage: maintaining the standard already built, and closing any single pillar that still falls below the certification floor before treating the position as fully institution-ready.',
  },
  2: {
    title: 'Growing / Inconsistent',
    body:
      'The business is operational but vulnerable. Systems exist across the business, but inconsistency means they will break under real pressure: funding diligence, rapid growth, team scaling, or an audit. The priority from here is standardization and enforcement, not building new structure. Fix what already exists before adding more. For single-member businesses specifically, this usually means separation is in place but the decision trail is thin, major decisions are not consistently recorded at the time they are made. The fix is a disciplined decision log habit and a signed compensation resolution, not a structural overhaul.',
  },
  3: {
    title: 'Operational but Exposed',
    body:
      'The business is functional but exposed. It can execute, but it cannot prove control, and that becomes a problem the moment someone outside the business asks for documentation: an investor, a lender, an auditor, or an attorney. Before pursuing funding or a major partnership, stabilize documentation and financial containment first. Expansion at this stage amplifies whatever risk already exists. For single-member businesses specifically, a score in this range often reflects a business that has been running on the founder\u2019s knowledge and personal judgment, functional day to day, but with a governance layer that has not kept pace with the operational one.',
  },
  4: {
    title: 'Unstable / High Exposure',
    body:
      'The business is operating without containment. Incorporation exists, but governance does not, which is extremely common at this stage and not a reflection of how hard the business is working. Scaling, seeking funding, or adding complexity without fixing this foundation first will create risk that compounds rather than resolves. The immediate priority is stabilization, not growth. For single-member businesses specifically, this typically means the business and the founder are not yet effectively separated, financial, operational, and decision-making habits are still personal rather than structural. Begin with the Tier 4 Stabilization Pack\u2019s 14-day protocol before anything else.',
  },
};

export const pillarContent: Record<PillarKey, Record<SeverityBand, PillarBandContent>> = {
  authorityClarity: {
    critical: {
      statusLabel: 'High Exposure',
      body:
        'At this level, decision-making authority exists only in memory. There is no Authority Matrix naming who can decide what, and no dollar thresholds separating a routine purchase from one that requires sign-off. Nothing about how this business makes decisions could be shown to a lender or partner on paper. This is one of the fastest ways an outside reviewer concludes the business is run informally, whatever the numbers say. Nothing else in this report carries weight until decision authority is written down and provable.',
      evidenceGap:
        'No signed Authority Matrix on file. No Decision Log. Operating Agreement or Bylaws, if they exist, do not name officers with specific authority provisions.',
    },
    weak: {
      statusLabel: 'Weak',
      body:
        'Some decisions may be documented, but not consistently, and there is likely no Authority Matrix defining dollar thresholds or categories of decision. A Decision Log may exist but with gaps that break the contemporaneous record a lender would expect. Authority is understood informally by the people involved, which works until someone outside the business needs to verify it.',
      evidenceGap:
        'Authority Matrix missing or incomplete. Decision Log has gaps exceeding 48 hours between entries. Operating Agreement or Bylaws lack specific authority provisions.',
    },
    developing: {
      statusLabel: 'Developing',
      body:
        'The structure exists. An Authority Matrix and Decision Log are likely both present, but the habit of logging decisions at the time they happen, rather than reconstructing them later, is inconsistent. This pillar clears the certification floor but is not yet institution-ready. The fix is discipline: log the decision the day it is made, not the week before a lender asks for it.',
      evidenceGap:
        'Authority Matrix and Decision Log exist but entries are not consistently contemporaneous.',
    },
    strong: {
      statusLabel: 'Established',
      body:
        'Decision-making authority here can withstand real scrutiny. A signed Authority Matrix names who can decide what and at what dollar threshold, the Decision Log is current and gap-free, and governing documents name officers with specific authority provisions. This is the standard a lender or partner expects to see. Maintain it as is. Revisit it when authority itself changes: adding an officer, changing signing thresholds, bringing on a partner or co-owner, or restructuring the entity. Short of one of those events, the existing structure holds.',
      evidenceGap:
        'None outstanding. Maintain the Decision Log without gaps and update the Authority Matrix whenever thresholds or authorized individuals change.',
    },
  },

  responsibilityOwnership: {
    critical: {
      statusLabel: 'High Exposure',
      body:
        'At this level, the business runs on one person\u2019s memory. There are no written role definitions, no SOPs a stranger could follow, and no continuity plan if the founder were unavailable for even a short period. A lender evaluating this pillar sees total founder dependency, which is one of the clearest signals that credit capacity should be limited. Nothing else in this report carries weight until the business can be shown to function without relying entirely on one person.',
      evidenceGap:
        'No Role Definition Sheets on file. No SOPs meeting the independence test. No succession or continuity plan.',
    },
    weak: {
      statusLabel: 'Weak',
      body:
        'Some roles or processes may be informally understood, but they are not written down in a way a stranger could follow. Fewer than three core processes have real SOPs, and any that exist likely would not pass the independence test, a competent person unfamiliar with the business could not execute them from the document alone. If the founder stepped away for a week, real gaps would show immediately.',
      evidenceGap:
        'Role Definition Sheets missing or incomplete. Fewer than three SOPs pass the independence test. No documented succession plan for key functions.',
    },
    developing: {
      statusLabel: 'Developing',
      body:
        'The foundation is in place. Role definitions and a handful of SOPs likely exist, and a continuity plan may be drafted, but enforcement is inconsistent, SOPs may be outdated, or the continuity plan may name backup responsibilities without activation conditions. This pillar clears the certification floor but is not yet institution-ready. The fix is keeping the SOP library current as the business changes, not building new structure.',
      evidenceGap:
        'Role Definition Sheets and SOPs exist but are not consistently current. Continuity plan may lack activation conditions.',
    },
    strong: {
      statusLabel: 'Established',
      body:
        'Operational independence here can withstand real scrutiny. Every active role has a written Role Definition Sheet with measurable standards, at least three core processes have SOPs that pass the independence test, and a continuity plan names backup responsibilities for key functions. This is the standard a lender evaluating credit capacity expects to see. Maintain it as is. Revisit it when roles themselves change: a new hire takes on a core function, a process changes materially, or a key person\u2019s responsibilities shift. Short of one of those events, the existing structure holds.',
      evidenceGap:
        'None outstanding. Review SOPs and the continuity plan whenever roles or core processes change.',
    },
  },

  moneyContainment: {
    critical: {
      statusLabel: 'High Exposure',
      body:
        'At this level, personal and business finances are not meaningfully separated. Spending moves through the business without a documented basis, and there is no resolution governing compensation. This is the fastest way institutional review ends before it starts. A lender or auditor examining ninety days of transaction history at this level would find commingling, undocumented transfers, or both. Nothing else in this report carries weight until this pillar is addressed.',
      evidenceGap:
        'No Financial Rules Sheet in place. No signed Compensation Resolution on file. Personal and business accounts are not fully separated.',
    },
    weak: {
      statusLabel: 'Weak',
      body:
        'Some separation exists, but it will not hold under real scrutiny. Spending may be informally understood rather than documented, and compensation is likely taken without a signed resolution governing amount, frequency, and authorization. A lender or investor reviewing this pillar would find gaps in the transfer trail even where accounts are technically separate.',
      evidenceGap:
        'Financial Rules Sheet may exist but is not consistently enforced. Compensation Resolution missing or outdated. Transfer basis is not documented for every movement between accounts.',
    },
    developing: {
      statusLabel: 'Developing',
      body:
        'The foundation is in place. Accounts are separated and a Compensation Resolution likely exists, but enforcement is inconsistent. A Monthly Financial Review Log may be missing or irregular, which means spending rules exist on paper without evidence they are actively followed. This pillar clears the certification floor but is not yet institution-ready. The fix is discipline, not structure: keep the review log current and treat every threshold as enforced, not optional.',
      evidenceGap:
        'Financial Rules Sheet exists but Monthly Financial Review Logs are incomplete or inconsistent.',
    },
    strong: {
      statusLabel: 'Established',
      body:
        'Financial governance here can withstand real scrutiny. Personal and business finances are fully separated, compensation is governed by a signed resolution, and spending is bound by documented thresholds that are actively enforced and reviewed. This is the standard a lender, investor, or auditor expects to see. Maintain it as is. Revisit it only when the business itself changes in a way that changes who controls money or how it moves: taking on a co-owner or outside investor, converting entity type, opening new accounts or credit lines, adding someone with signing authority, or taking on institutional debt with its own compliance terms. Short of one of those events, the existing structure holds.',
      evidenceGap:
        'None outstanding. Maintain monthly review log discipline and update the Compensation Resolution whenever terms or ownership change.',
    },
  },

  evidenceIntegrity: {
    critical: {
      statusLabel: 'High Exposure',
      body:
        'At this level, governance records are scattered, if they exist at all. There is no organized vault, and producing proof of a decision or a filing on short notice would take far longer than the ten minutes a lender or auditor expects. Entity information may not even match cleanly across state filings, the IRS, and bank accounts. This is one of the fastest ways an enterprise loses credibility even when the underlying business is sound. Nothing else in this report carries weight until records can be found and trusted.',
      evidenceGap:
        'No organized Document Vault. Entity name, address, or EIN inconsistent across records. Governing documents not updated after known changes.',
    },
    weak: {
      statusLabel: 'Weak',
      body:
        'Some records exist, but they are not organized into a structure that could stand up to a real request. Retrieval would take significantly longer than ten minutes, and there may be small inconsistencies in how the business is named or identified across filings, bank accounts, and contracts, exactly the kind of discrepancy that triggers delays in institutional review.',
      evidenceGap:
        'Document Vault missing or disorganized. Minor entity information inconsistencies across records. Governing document amendments not consistently filed.',
    },
    developing: {
      statusLabel: 'Developing',
      body:
        'The foundation is in place. A document structure likely exists and entity information is mostly consistent, but retrieval is not yet reliably fast, and governing document updates lag behind actual changes rather than being filed within thirty days. This pillar clears the certification floor but is not yet institution-ready. The fix is timeliness: update the record when the change happens, not when someone asks for it.',
      evidenceGap:
        'Document Vault exists but retrieval and update timeliness are inconsistent.',
    },
    strong: {
      statusLabel: 'Established',
      body:
        'Record-keeping here can withstand real scrutiny. Governance documents are organized into a structured vault that can produce any record within ten minutes, entity information matches cleanly across every institutional record, and governing documents are amended within thirty days of any material change. This is the standard a lender or auditor expects to see. Maintain it as is. Revisit it when a record changes: a new officer, a new address, an amended agreement. Short of one of those events, the existing structure holds.',
      evidenceGap:
        'None outstanding. Keep the vault current and file amendments within thirty days of any material change.',
    },
  },

  governanceDiscipline: {
    critical: {
      statusLabel: 'High Exposure',
      body:
        'At this level, the business has no written account of its own risk exposure, no confirmed insurance coverage matched to that exposure, and no documentation showing who actually owns its intellectual property, the entity or the founder personally. This is the pillar that holds everything else together under pressure, and at this level, it would not. Nothing else in this report carries weight until the business can show it has named its risks and protected what it has built.',
      evidenceGap:
        'No written risk identification document. No confirmed insurance coverage on file. No IP assignment documentation, ownership of core IP is unclear.',
    },
    weak: {
      statusLabel: 'Weak',
      body:
        'Risk awareness may exist informally, but it is not written down with specific exposures and mitigation status. Insurance coverage may exist but has not been checked against current risk. Intellectual property, the frameworks, the brand, the methodology the business runs on, is most likely still assumed to belong to the entity rather than formally assigned to it. That gap is one of the most common and most overlooked failures for solo operators specifically.',
      evidenceGap:
        'Risk identification document missing or informal. Insurance coverage not verified against current exposure. IP assignment agreements missing or incomplete.',
    },
    developing: {
      statusLabel: 'Developing',
      body:
        'The foundation is in place. A risk document and insurance coverage likely exist, and IP assignment may be partially documented, but review is not yet a habit. This pillar clears the certification floor but is not yet institution-ready. The fix is an annual formality: review the risk register, confirm coverage still matches exposure, and confirm IP assignment covers anything created since the last review.',
      evidenceGap:
        'Risk document and insurance exist but are not reviewed on a regular cadence. IP assignment may not cover recent work.',
    },
    strong: {
      statusLabel: 'Established',
      body:
        'Structural protection here can withstand real scrutiny. Risk exposures are documented with materiality and mitigation status, insurance coverage is current and proportional to actual risk, and intellectual property, including any frameworks, trademarks, or proprietary methodology, is formally assigned to the entity rather than held personally. This is the standard a lender or investor expects to see. Maintain it as is. Revisit it when the business itself changes: new IP is created, coverage needs shift, or ownership structure changes. Short of one of those events, the existing structure holds.',
      evidenceGap:
        'None outstanding. Review the risk register and insurance coverage annually, and assign new IP to the entity as it is created.',
    },
  },
};

// firstAction and kit sourced directly from the Score Interpretation
// Guide's Implementation Sequence table. rootCause ties the fix back
// to the Governance Equation (Manual Ch. 8) so the report teaches the
// system, not just the document that is missing.
export const weakestPillarFirstAction: Record<PillarKey, WeakestPillarAction> = {
  authorityClarity: {
    rootCause:
      'This pillar is produced by running the D.E.D discipline on Decision Flow: deciding with defined authority, executing through the person actually authorized to act, and recording the decision at the time it is made. A low score here means that motion is not yet running consistently. It is not, at its root, a missing document. It is a missing habit that a document then makes provable.',
    firstAction:
      'Document decision rights. Create approval thresholds. Establish consent processes and a decision log habit.',
    kit: 'Tier 3 Implementation Kit, Phase 1, or the Tier 4 Stabilization Pack.',
  },
  responsibilityOwnership: {
    rootCause:
      'This pillar is produced by running the D.E.D discipline on Responsibility Flow: deciding who owns a function, executing through documented roles rather than personal habit, and recording the process so it survives beyond any one person. A low score here means the business runs on memory rather than a written system. It is not, at its root, a missing document. It is a missing habit that a document then makes provable.',
    firstAction:
      'Create role definitions. Document processes. Establish handoff protocols and an SOP library for core workflows.',
    kit: 'Tier 3 Implementation Kit, Phase 3, or the Tier 4 Stabilization Pack.',
  },
  moneyContainment: {
    rootCause:
      'This pillar is produced by running the D.E.D discipline on Money Flow: deciding with authority, executing through documented roles, and recording the trail behind every dollar that moves. A low score here means that motion is not yet running consistently. It is not, at its root, a missing document. It is a missing habit that a document then makes provable.',
    firstAction:
      'Separate accounts completely. Formalize compensation by signed resolution. Document every financial decision and establish spending thresholds that are actually enforced.',
    kit: 'Tier 3 Implementation Kit, Phase 2, or the Tier 4 Stabilization Pack.',
  },
  evidenceIntegrity: {
    rootCause:
      'This pillar is the Document act of D.E.D, made durable, and it runs across all three flows at once rather than belonging to just one. Every decision, every dollar moved, every role assigned ends in documentation, and this pillar measures whether that documentation is contemporaneous, organized, and accessible. A low score here means proof exists somewhere, but not where it can be produced on demand. It is not, at its root, a missing document. It is a missing system for keeping documents current and retrievable.',
    firstAction:
      'Organize existing documents into a vault structure. Establish contemporaneous recording practices. Create accessible, organized storage.',
    kit: 'Tier 3 Implementation Kit, Phase 4, or the Document Vault Setup protocol.',
  },
  governanceDiscipline: {
    rootCause:
      'This pillar is D.E.D sustained under pressure, and like Evidence Integrity, it runs across all three flows rather than belonging to just one. A founder can run good governance during a calm week. This pillar is not earned in calm weeks. It is earned when the business faces real risk, a dispute, a lapsed policy, a question over who owns the IP, and the documentation holds anyway. A low score here means that discipline has not been tested yet, or did not hold when it was.',
    firstAction:
      'Document asset ownership. Formalize IP assignment. Establish structural protection practices and annual formality habits.',
    kit: 'Tier 2 Implementation Kit (in development), or a Governance Stabilization Sprint consultation.',
  },
};

export const tierNextStep: Record<Tier, TierNextStep> = {
  1: {
    step:
      'Apply for the Zytrion Governance Readiness Certification. Join Enterprise membership to maintain the standard and access quarterly re-assessment.',
    product: 'Enterprise Membership, $197 per month.',
  },
  2: {
    step:
      'Standardize and enforce the controls that already exist rather than build new ones. The Tier 2 Implementation Kit addresses inconsistency at the system level. Pro membership provides monthly governance content and discounted re-assessment.',
    product: 'Pro Membership, $97 per month.',
  },
  3: {
    step:
      'Begin the Tier 3 Implementation Kit immediately and complete the 30-day stabilization sequence. Retake the diagnostic on day 31 to confirm the gap has closed.',
    product: 'Tier 3 Implementation Kit, $2,997 to $4,997.',
  },
  4: {
    step:
      'Begin the 14-Day Stabilization Protocol immediately. Do not pursue funding or expansion until the protocol is complete.',
    product: 'Tier 4 Stabilization Pack, $997.',
  },
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
