import { STATEMENTS, PILLAR_IDS, TIER_IDS, Section } from "./statements";

export type AnswerValue = 0 | 1 | 2; // No, In Progress, Yes

export type Answers = Record<string, AnswerValue>; // statement id -> value

export interface PillarResult {
  pillarId: string;
  pillarName: string;
  section: Section;
  score: number; // out of 16
  maxScore: 16;
}

export interface ScoringResult {
  totalScore: number; // out of 80
  tierId: string;
  tierNumber: 1 | 2 | 3 | 4;
  tierName: string;
  pillarResults: PillarResult[];
  lowestPillar: PillarResult;
}

const TIER_NAMES: Record<1 | 2 | 3 | 4, string> = {
  1: "Governed / Institution-Ready",
  2: "Growing / Inconsistent",
  3: "Operational but Exposed",
  4: "Unstable / High Exposure",
};

function tierForScore(totalScore: number): { id: string; number: 1 | 2 | 3 | 4 } {
  if (totalScore >= 65) return { id: TIER_IDS.TIER_1, number: 1 };
  if (totalScore >= 45) return { id: TIER_IDS.TIER_2, number: 2 };
  if (totalScore >= 25) return { id: TIER_IDS.TIER_3, number: 3 };
  return { id: TIER_IDS.TIER_4, number: 4 };
}

/**
 * Scores a completed GRID Diagnostic.
 * Every one of the 40 statements must have an answer, or this throws,
 * since a partial assessment cannot be scored or placed in the national
 * dataset with integrity.
 */
export function scoreAssessment(answers: Answers): ScoringResult {
  const missing = STATEMENTS.filter((s) => answers[s.id] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `Cannot score an incomplete assessment. Missing answers for: ${missing.map((s) => s.id).join(", ")}`
    );
  }

  const sections: Section[] = [1, 2, 3, 4, 5];
  const pillarResults: PillarResult[] = sections.map((section) => {
    const sectionStatements = STATEMENTS.filter((s) => s.section === section);
    const score = sectionStatements.reduce((sum, s) => sum + answers[s.id], 0);
    return {
      pillarId: sectionStatements[0].pillarId,
      pillarName: sectionStatements[0].pillarName,
      section,
      score,
      maxScore: 16,
    };
  });

  const totalScore = pillarResults.reduce((sum, p) => sum + p.score, 0);
  const tier = tierForScore(totalScore);

  // The lowest pillar is the structural bottleneck and the anchor for the
  // next-step recommendation. On a tie, the earlier section wins, since
  // Section 1 (Authority Clarity) is the foundational pillar in the system.
  const lowestPillar = pillarResults.reduce((lowest, p) =>
    p.score < lowest.score ? p : lowest
  );

  return {
    totalScore,
    tierId: tier.id,
    tierNumber: tier.number,
    tierName: TIER_NAMES[tier.number],
    pillarResults,
    lowestPillar,
  };
}
