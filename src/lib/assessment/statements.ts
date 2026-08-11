// Zytrion GRID Diagnostic - live instrument, Assessment Version 6.
// 40 statements, 5 sections of 8, 80-point ceiling.
// Do not add, remove, or reorder statements without a new locked version.
// See Platform Build Specification: instrument_version is stamped on every
// assessment record so the national dataset stays comparable across time.

export const PILLAR_IDS = {
  AUTHORITY_CLARITY: "a1000000-0000-0000-0000-000000000001",
  RESPONSIBILITY_OWNERSHIP: "a1000000-0000-0000-0000-000000000002",
  MONEY_CONTAINMENT: "a1000000-0000-0000-0000-000000000003",
  EVIDENCE_INTEGRITY: "a1000000-0000-0000-0000-000000000004",
  GOVERNANCE_DISCIPLINE: "a1000000-0000-0000-0000-000000000005",
} as const;

export const TIER_IDS = {
  TIER_1: "b2000000-0000-0000-0000-000000000001", // 65-80, Governed / Institution-Ready
  TIER_2: "b2000000-0000-0000-0000-000000000002", // 45-64, Growing / Inconsistent
  TIER_3: "b2000000-0000-0000-0000-000000000003", // 25-44, Operational but Exposed
  TIER_4: "b2000000-0000-0000-0000-000000000004", // 0-24, Unstable / High Exposure
} as const;

export type Section = 1 | 2 | 3 | 4 | 5;

export interface Statement {
  id: string; // e.g. "1.1"
  section: Section;
  sectionTitle: string;
  pillarId: string;
  pillarName: string;
  text: string;
  evidence: string; // the proof standard / example / test
}

const SECTION_TITLES: Record<Section, string> = {
  1: "Decision Authority & Governance",
  2: "Responsibility Flow & Operations",
  3: "Financial Behavior & Containment",
  4: "Documentation Integrity",
  5: "Structural Risk & Protection Readiness",
};

const SECTION_PILLARS: Record<Section, { id: string; name: string }> = {
  1: { id: PILLAR_IDS.AUTHORITY_CLARITY, name: "Authority Clarity" },
  2: { id: PILLAR_IDS.RESPONSIBILITY_OWNERSHIP, name: "Responsibility Ownership" },
  3: { id: PILLAR_IDS.MONEY_CONTAINMENT, name: "Money Containment" },
  4: { id: PILLAR_IDS.EVIDENCE_INTEGRITY, name: "Evidence Integrity" },
  5: { id: PILLAR_IDS.GOVERNANCE_DISCIPLINE, name: "Governance Discipline" },
};

function stmt(id: string, section: Section, text: string, evidence: string): Statement {
  return {
    id,
    section,
    sectionTitle: SECTION_TITLES[section],
    pillarId: SECTION_PILLARS[section].id,
    pillarName: SECTION_PILLARS[section].name,
    text,
    evidence,
  };
}

export const STATEMENTS: Statement[] = [
  // SECTION 1 - Decision Authority & Governance
  stmt("1.1", 1, "Decision authority is explicitly defined and documented.",
    "Operating agreement or bylaws specify who approves contracts over $10K, hiring decisions, and strategic pivots, not just \"the board\" but named roles with clear thresholds."),
  stmt("1.2", 1, "I can identify who has final authority for major decisions.",
    "If asked right now who approves a $50K vendor contract, you can answer in five seconds without checking documents or asking someone."),
  stmt("1.3", 1, "When significant decisions are needed, your enterprise has a consistent process that determines who approves and how authority is exercised.",
    "Red flag: \"we had to move fast so I just approved it,\" or \"nobody said I couldn't.\""),
  stmt("1.4", 1, "Governing documents are actively referenced when decisions are made.",
    "When significant decisions occur, your enterprise references documented governance standards rather than relying on memory or assumption."),
  stmt("1.5", 1, "Authority does not shift informally under pressure.",
    "Red flag: during tight deadlines or crises, different people start making decisions that would normally require formal approval."),
  stmt("1.6", 1, "Ownership and control are clearly separated.",
    "You understand the difference between owning equity and having decision authority, and this is documented, not just understood verbally."),
  stmt("1.7", 1, "Decisions are documented at the time they are made.",
    "Board resolutions, consent forms, or approval emails exist for major decisions made in the last 90 days, created when the decision was made, not reconstructed later."),
  stmt("1.8", 1, "Governance decisions are made in structured settings with recorded outcomes.",
    "Strategic and operational decisions occur in scheduled forums with prepared agendas. Outcomes and next steps are documented after each meeting, not reconstructed from memory. Red flag: major decisions happen in hallway conversations, text threads, or last-minute calls with no record of what was decided or who authorized it."),

  // SECTION 2 - Responsibility Flow & Operations
  stmt("2.1", 2, "Responsibilities are assigned, not assumed.",
    "Red flag: \"I think Sarah handles that\" or \"we just know who does what\" without written role definitions or accountability charts."),
  stmt("2.2", 2, "I can trace responsibility from initiation to completion.",
    "Pick any process, such as invoice payment. You can identify every handoff point, who owns each step, and where it currently sits, in under two minutes."),
  stmt("2.3", 2, "Operational processes are documented and repeatable.",
    "SOPs, checklists, or process maps exist for at least three recurring workflows, and someone other than you has successfully executed them using the documentation."),
  stmt("2.4", 2, "The business can operate briefly without my direct involvement.",
    "You could take an unplanned three-day absence and critical operations would continue without requiring your input on every decision."),
  stmt("2.5", 2, "I know where execution slows or breaks.",
    "You can name the top three bottlenecks in your operation right now and explain what structural issue, not just \"we're busy,\" causes each one."),
  stmt("2.6", 2, "Operational decisions follow a defined process.",
    "Vendor selection, hiring approval, or scope changes follow a documented workflow with clear decision points, not ad hoc judgment calls each time."),
  stmt("2.7", 2, "What works is captured and reused.",
    "When something goes well, such as a successful campaign or smooth client onboarding, the process is documented so it can be repeated, not just celebrated and forgotten."),
  stmt("2.8", 2, "Role performance is measured against defined expectations, not observed informally.",
    "Key roles have documented outcomes or performance indicators. Leadership reviews whether responsibilities are being fulfilled on a defined schedule, not only when problems arise. Red flag: performance is judged subjectively, inconsistently, or only in response to failure."),

  // SECTION 3 - Financial Behavior & Containment
  stmt("3.1", 3, "Business and personal finances are fully separated.",
    "No personal expenses on business accounts in the last 90 days. No business expenses on personal cards, or if so, reimbursed formally with documentation. Separate bank accounts, separate credit cards."),
  stmt("3.2", 3, "Money movement follows defined rules.",
    "Expense approval thresholds are documented (for example, $500 requires manager approval, $5K requires director approval, $25K requires board approval). Disbursement requires specific authorization."),
  stmt("3.3", 3, "Owner compensation is intentional and documented.",
    "Salary, distributions, or draws are set by board resolution or operating agreement, not \"I take what I need when I need it.\" There is a paper trail for every transfer to you personally."),
  stmt("3.4", 3, "Financial decisions are made deliberately, not emotionally.",
    "Red flag: \"we're doing great, let's buy that,\" or \"we're stressed, I need a distribution,\" without reference to budget or cash position."),
  stmt("3.5", 3, "Operating costs are known and reviewed.",
    "You can state your monthly burn rate within five percent accuracy without looking it up. You review a profit and loss statement at least monthly."),
  stmt("3.6", 3, "Taxes are planned, not reacted to.",
    "Quarterly tax estimates are calculated and set aside. Year-end tax planning happens in the fourth quarter, not in April."),
  stmt("3.7", 3, "Financial behavior supports protection.",
    "Your financial behavior over the last twelve months, if audited, would reinforce that the business is a separate entity, not raise commingling or alter-ego concerns."),
  stmt("3.8", 3, "Cash position and operating runway are known at any time without reconstructing data from multiple sources.",
    "Current cash balance, projected obligations, and estimated operating runway are accessible through a single, maintained source of financial truth, not assembled after the fact from scattered accounts. Red flag: cash position is unknown without pulling records from multiple accounts, platforms, or personal devices."),

  // SECTION 4 - Documentation Integrity
  stmt("4.1", 4, "Decisions are recorded contemporaneously.",
    "When a major decision is made, such as a new equity round, key hire, or strategic pivot, documentation is created that week, not reconstructed months later when needed."),
  stmt("4.2", 4, "Documentation reflects reality, not intention.",
    "Red flag: operating agreement says \"quarterly board meetings\" but none have occurred in eighteen months. Documents describe processes you don't actually follow."),
  stmt("4.3", 4, "I know which documents carry authority.",
    "If asked what governs equity allocation or where hiring authority is defined, you can name the specific document and section, not guess."),
  stmt("4.4", 4, "Records are accessible and organized.",
    "You could produce your formation documents, current cap table, and last three board resolutions in under ten minutes, from a known location."),
  stmt("4.5", 4, "Written consent is used when required.",
    "When unanimous consent is needed, such as for equity issuance, a major contract, or dissolution, you get signatures, not verbal agreements or assumptions."),
  stmt("4.6", 4, "Documentation is updated as structure evolves.",
    "When you add a new officer, change ownership, or modify operating procedures, the governing documents are amended within thirty days."),
  stmt("4.7", 4, "Critical business data is stored in secure, backed-up systems, not on personal devices or scattered locations.",
    "Customer data, financial records, contracts, and operational files have defined storage locations with access controls and documented backup procedures in place. Red flag: key records exist only on personal devices, email threads, or unmanaged cloud folders with no backup procedure."),
  stmt("4.8", 4, "Documentation is treated as infrastructure.",
    "Creating proper documentation is budgeted, in time and money, not seen as overhead to skip when busy. Missing documentation is treated as operational risk, not administrative backlog."),

  // SECTION 5 - Structural Risk & Protection Readiness
  stmt("5.1", 5, "I can identify where the business is exposed.",
    "You can name your top three liability exposures, contractual, operational, or structural, and explain what makes each one material."),
  stmt("5.2", 5, "Asset ownership is intentional and documented.",
    "You know what the entity owns versus what you personally own. IP assignment agreements exist. Equipment, domains, and key assets have clear title documentation."),
  stmt("5.3", 5, "Intellectual property is recognized and governed.",
    "Work-for-hire agreements or IP assignment from contractors and employees exist. You know whether your IP is protected by the entity or personally held."),
  stmt("5.4", 5, "I understand when additional structure is required.",
    "You can articulate the threshold at which you would need a holding company, separate operating entities, or additional liability layers, based on risk profile, not just revenue."),
  stmt("5.5", 5, "Protection is proactive, not reactive.",
    "Red flag: you only think about structure when someone threatens to sue, an investor asks for diligence, or you're applying for financing, not as ongoing operational discipline."),
  stmt("5.6", 5, "Credit is approached strategically, not opportunistically.",
    "Business credit is built deliberately with purpose, such as vendor terms or strategic financing. You understand utilization targets and don't open credit simply because it's available."),
  stmt("5.7", 5, "I do not equate access with readiness.",
    "You distinguish between \"we can get a loan\" and \"we should take the loan.\" Access to capital doesn't mean you're structurally ready to deploy it wisely."),
  stmt("5.8", 5, "Long-term consequences are considered before expansion.",
    "Before adding investors, new entities, debt, or major partnerships, you evaluate governance impact and structural complexity, not just short-term benefit."),
];

export const SECTIONS: Section[] = [1, 2, 3, 4, 5];

export function statementsForSection(section: Section): Statement[] {
  return STATEMENTS.filter((s) => s.section === section);
}

export const INSTRUMENT_VERSION = "V6";
