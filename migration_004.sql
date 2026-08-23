-- ============================================================================
-- Zytrion Kit Portal :: Seed Data 004
-- kits, kit_phases (Tiers 4/3/2), maintenance_items (Tier 1), retake_bridges,
-- certification_evidence_package, and the tools referenced by all of the
-- above. Pulled from the actual Tier 1-4 Implementation Kit documents and
-- the Roadmap Sequence document, not placeholder data.
-- ============================================================================

begin;

insert into tools (tool_name, pillar_id, portal_render_type, description)
select v.tool_name, p.id, v.render_type, v.description
from (values
  ('3 Flows Reset Worksheet', 'Governance Discipline', 'worksheet',
   'Baseline reset across Decision, Money, and Responsibility Flow. The first tool completed in the Tier 4 protocol.'),
  ('Authority Delegation Memo', 'Authority Clarity', 'form',
   'Documents who is authorized to act on the enterprise''s behalf and under what scope.'),
  ('Decision Log', 'Authority Clarity', 'log',
   'Running record of every decision above threshold, logged within 48 hours of being made.'),
  ('Document Vault Setup', 'Evidence Integrity', 'upload',
   'The nine-folder evidence structure that makes every governance document retrievable in under ten minutes.'),
  ('Spending Approval Rule Sheet', 'Money Containment', 'form',
   'Written thresholds for who may approve spending at each dollar level.'),
  ('Authority Matrix', 'Authority Clarity', 'form',
   'Decision-category-by-decision-category record of who is authorized, at what threshold, with what evidence required.'),
  ('Compensation and Distribution Resolution', 'Money Containment', 'form',
   'Sole officer or board resolution formalizing owner compensation and distribution amounts.'),
  ('Financial Governance Rules Sheet', 'Money Containment', 'form',
   'Written, posted rules governing how money is authorized to move at each threshold.'),
  ('Role Definition Sheet', 'Responsibility Ownership', 'form',
   'One completed sheet per functional role: outcomes owned, authority held, escalation path.'),
  ('SOP Template', 'Responsibility Ownership', 'worksheet',
   'Standard operating procedure format for high-frequency workflows, tested for role-independence.'),
  ('Inconsistency Audit Worksheet', 'Governance Discipline', 'checklist',
   'Practice review, not a document review: for each governance item, whether it happens every time, sometimes, or not at all.'),
  ('Audit Priority Matrix', 'Governance Discipline', 'worksheet',
   'Every gap surfaced by the Inconsistency Audit, ranked by visibility to an investor, lender, or diligence reviewer.'),
  ('Financial Traceability Worksheet', 'Money Containment', 'worksheet',
   '90-day transaction-by-transaction review confirming a documented authorization exists for every transaction above threshold.'),
  ('Monthly Financial Review Log', 'Money Containment', 'log',
   'Dated, signed monthly confirmation that balances, transfers, and compensation match policy.'),
  ('SOP Independence Test', 'Responsibility Ownership', 'checklist',
   'Six-question test confirming an SOP can be executed by someone with no personal knowledge of the current team.'),
  ('Role Accountability Standard', 'Responsibility Ownership', 'form',
   'Measurable performance and governance standard for a role, independent of who currently fills it.'),
  ('Governance Binder and Self-Audit Worksheet', 'Evidence Integrity', 'checklist',
   'Full five-pillar binder assembly with a pillar-by-pillar self-audit prior to retake or certification.'),
  ('Quarterly Governance Review', 'Governance Discipline', 'worksheet',
   'Full three-flow consistency review, filed as a dated memo, four times a year at Tier 1.'),
  ('Annual Governance Calendar', 'Governance Discipline', 'checklist',
   'The scheduling backbone of Tier 1 maintenance: every discipline, its cadence, its responsible party, its record.')
) as v(tool_name, pillar_name, render_type, description)
join pillars p on p.pillar_name = v.pillar_name
where not exists (
  select 1 from tools t where t.tool_name = v.tool_name
);

insert into kits (tier_id, title, kit_type, price_standard, price_extended, duration_days, purpose_statement, delivery_note)
select t.id, v.title, v.kit_type, v.price_standard, v.price_extended, v.duration_days, v.purpose_statement, v.delivery_note
from (values
  (4, 'Tier 4 Stabilization Pack', 'protocol', 99700, null, 14,
   'Establishes minimum governability across Decision Flow, Money Flow, Responsibility Flow, and the Evidence Standard for enterprises operating without provable control.',
   'Delivered in-portal. Not included with GRID results.'),
  (3, 'Tier 3 Implementation Kit', 'sequence', 299700, 499700, 60,
   'Converts informal habits into governed, documented, defensible structure across the Three Flows, pillar by pillar.',
   'Delivered in-portal. Not included with GRID results.'),
  (2, 'Tier 2 Implementation Kit', 'sequence', 399700, null, 90,
   'Audits existing structure for inconsistency and installs the enforcement habits that make partial governance hold under pressure.',
   'Delivered in-portal. Not included with GRID results.'),
  (1, 'Tier 1 Maintenance Kit', 'maintenance', 499700, null, null,
   'Active maintenance, strategic optimization, and institutional leverage of governance infrastructure already built and enforced.',
   'Delivered in-portal. Not included with GRID results.')
) as v(tier_number, title, kit_type, price_standard, price_extended, duration_days, purpose_statement, delivery_note)
join tiers t on t.tier_number = v.tier_number
where not exists (
  select 1 from kits k where k.title = v.title
);

insert into kit_phases (kit_id, phase_number, day_start, day_end, focus_pillar_id, title, objective, tool_id, evidence_produced, sort_order)
select k.id, v.phase_number, v.day_start, v.day_end, p.id, v.title, v.objective, tl.id, v.evidence_produced, v.phase_number
from (values
  (1, 1, 3, 'Money Containment', 'Immediate Setup',
   'Create the document vault structure, complete the 3 Flows Reset Worksheet, begin the Decision Log, and separate all bank accounts.',
   '3 Flows Reset Worksheet',
   'Document Vault structure created; 3 Flows Reset Worksheet completed; Decision Log opened; bank accounts separated'),
  (2, 4, 10, 'Authority Clarity', 'Implementation',
   'Complete all 25 Stabilization Checklist items, apply the Spending Approval Rule Sheet, document authority delegation, and conduct a weekly money review.',
   'Authority Delegation Memo',
   'Spending Approval Rule Sheet in use; Authority Delegation Memo signed; two weekly money reviews completed'),
  (3, 11, 14, 'Evidence Integrity', 'Validation',
   'Verify all evidence is accessible, test document vault retrieval, review Decision Log completeness, and prepare for the Day 15 retake.',
   'Document Vault Setup',
   'Vault retrieval tested under ten minutes; Decision Log reviewed for gaps; retake scheduled')
) as v(phase_number, day_start, day_end, pillar_name, title, objective, tool_name, evidence_produced)
join kits k on k.title = 'Tier 4 Stabilization Pack'
join pillars p on p.pillar_name = v.pillar_name
join tools tl on tl.tool_name = v.tool_name
where not exists (
  select 1 from kit_phases kp where kp.kit_id = k.id and kp.phase_number = v.phase_number
);

insert into kit_phases (kit_id, phase_number, day_start, day_end, focus_pillar_id, title, objective, tool_id, evidence_produced, sort_order)
select k.id, v.phase_number, v.day_start, v.day_end, p.id, v.title, v.objective, tl.id, v.evidence_produced, v.phase_number
from (values
  (1, 1, 12, 'Authority Clarity', 'Decision Flow Buildout',
   'Build formal authority structure: approval thresholds, consent documentation, and Decision Log discipline.',
   'Authority Matrix',
   'Signed Authority Matrix; Decision Log with 12 days of entries'),
  (2, 13, 24, 'Money Containment', 'Money Flow Buildout',
   'Formalize compensation, write spending approval rules, and complete the first Monthly Financial Review.',
   'Compensation and Distribution Resolution',
   'Signed Compensation Resolution; Spending Policy on file; first Monthly Financial Review completed'),
  (3, 25, 36, 'Responsibility Ownership', 'Responsibility Flow Buildout',
   'Complete Role Accountability Sheets for every active role and write three core operational SOPs.',
   'Role Definition Sheet',
   'Role Definition Sheets for all active roles; three SOPs with handoff documentation'),
  (4, 37, 48, 'Evidence Integrity', 'Evidence Layer Buildout',
   'Organize the document vault by pillar, establish contemporaneous recording practice, and test evidence retrieval.',
   'Document Vault Setup',
   'Document vault organized by pillar; retrieval test completed in under ten minutes; currency audit complete'),
  (5, 49, 58, 'Governance Discipline', 'Verification Preparation',
   'Assemble the complete Governance Binder across all five pillars and complete the pillar-by-pillar self-audit before retake.',
   'Governance Binder and Self-Audit Worksheet',
   'Complete Governance Binder with all five pillar sections; self-audit completed; gap list resolved')
) as v(phase_number, day_start, day_end, pillar_name, title, objective, tool_name, evidence_produced)
join kits k on k.title = 'Tier 3 Implementation Kit'
join pillars p on p.pillar_name = v.pillar_name
join tools tl on tl.tool_name = v.tool_name
where not exists (
  select 1 from kit_phases kp where kp.kit_id = k.id and kp.phase_number = v.phase_number
);

insert into kit_phases (kit_id, phase_number, day_start, day_end, focus_pillar_id, title, objective, tool_id, evidence_produced, sort_order)
select k.id, v.phase_number, v.day_start, v.day_end, p.id, v.title, v.objective, tl.id, v.evidence_produced, v.phase_number
from (values
  (1, 1, 15, 'Governance Discipline', 'Governance Audit',
   'Identify every inconsistency across all three flows: a practice review, not a document review. Complete the Audit Priority Matrix.',
   'Inconsistency Audit Worksheet',
   'Completed Inconsistency Audit Worksheet; ranked Audit Priority Matrix'),
  (2, 16, 35, 'Authority Clarity', 'Decision Flow Enforcement',
   'Close every authority gap identified in the audit and rebuild Decision Log discipline under the 48-hour rule.',
   'Authority Matrix',
   'Enforced Authority Matrix; 20-day Decision Log with zero missed entries'),
  (3, 36, 55, 'Money Containment', 'Money Flow Enforcement',
   'Trace every financial gap surfaced by the audit and install the monthly review as a non-negotiable discipline.',
   'Financial Traceability Worksheet',
   'Completed Financial Traceability Worksheet; Monthly Financial Review Log with first entries current'),
  (4, 56, 75, 'Responsibility Ownership', 'Responsibility Flow Enforcement',
   'Test every SOP for role-independence and close the role accountability gaps the audit identified.',
   'SOP Independence Test',
   'SOP Independence Test results for every SOP; updated Role Accountability Standards'),
  (5, 76, 88, 'Evidence Integrity', 'Evidence Consolidation',
   'Fill every vault gap, bring every document current, and assemble the certification-ready governance binder.',
   'Governance Binder and Self-Audit Worksheet',
   'Complete document vault; governance binder index; all documents current-dated')
) as v(phase_number, day_start, day_end, pillar_name, title, objective, tool_name, evidence_produced)
join kits k on k.title = 'Tier 2 Implementation Kit'
join pillars p on p.pillar_name = v.pillar_name
join tools tl on tl.tool_name = v.tool_name
where not exists (
  select 1 from kit_phases kp where kp.kit_id = k.id and kp.phase_number = v.phase_number
);

insert into maintenance_items (kit_id, frequency, discipline, purpose, evidence_expected)
select k.id, v.frequency, v.discipline, v.purpose, v.evidence_expected
from (values
  ('weekly', 'Decision Log Review (Weekly)',
   'Prevents decision documentation drift by catching gaps within days rather than at month end.',
   'Continuous Decision Log with no gaps; all decisions above threshold documented within 48 hours'),
  ('monthly', 'Monthly Financial Review',
   'Maintains Money Flow containment: balances, transfers, compensation, expenses, and a mixing check.',
   'Signed Monthly Financial Review Log entry on file'),
  ('monthly', 'Decision Log Review',
   'Confirms all decisions above threshold in the prior month were logged within 48 hours; flags and retroactively documents any gaps.',
   'Decision Log current through the last day of the prior month'),
  ('monthly', 'Evidence Vault Check',
   'Confirms new documents generated in the prior month have been filed in the correct vault folder with current status.',
   'Vault folder updated; no drafts or outdated versions present'),
  ('quarterly', 'Quarterly Governance Review',
   'Reviews all three flows for consistency and identifies practices that have drifted from the documented standard.',
   'Quarterly Review Memo filed in the Decisions folder'),
  ('quarterly', 'Role and SOP Currency Check',
   'Confirms role definitions and SOPs reflect current practice; flags anything over 12 months old or no longer accurate.',
   'SOP Currency Log updated with date of last review for each document'),
  ('quarterly', 'Financial Policy Confirmation',
   'Confirms the compensation resolution is current and spending thresholds remain appropriate for current scale.',
   'Compensation resolution reviewed; updated by sole officer resolution if changed'),
  ('semi_annual', 'SOP and Role Review (Semi-Annual)',
   'Prevents operational documents from becoming outdated by testing every SOP for currency and verifying role definitions match current team structure.',
   'Updated SOPs and Role Sheets'),
  ('annual', 'Annual State Compliance Filing',
   'Confirms the annual report is filed and the registered agent and state good standing are current.',
   'State good standing certificate current for the year, filed in 09_Compliance'),
  ('annual', 'Annual Governance Retake',
   'Confirms the governance standard is maintained. A maintained Tier 1 enterprise should score 65 or above on every annual retake.',
   'Annual GRID score on file; certification renewal submitted if applicable'),
  ('annual', 'IP and Asset Ownership Review',
   'Confirms all intellectual property created in the prior year is assigned to the correct entity and all digital assets are registered in the entity name.',
   'IP Assignment Log updated; new assignments documented by sole officer resolution'),
  ('annual', 'Operating Agreement Currency Review',
   'Confirms the operating agreement reflects current ownership, authority structure, and decision-making protocols.',
   'Signed amendment on file if changes were made'),
  ('annual', 'Succession Readiness Confirmation',
   'Confirms the Succession Readiness Protocol is current, accessible, and reflects the current state of the enterprise.',
   'Succession Readiness Protocol reviewed and dated')
) as v(frequency, discipline, purpose, evidence_expected)
join kits k on k.title = 'Tier 1 Maintenance Kit'
where not exists (
  select 1 from maintenance_items mi where mi.kit_id = k.id and mi.discipline = v.discipline
);

insert into retake_bridges (kit_id, retake_score_min, retake_score_max, resulting_tier_id, next_step_action, next_kit_id)
select k.id, v.score_min, v.score_max, rt.id, v.action, nk.id
from (values
  (0, 24, 4, 'Score below 25: the protocol needs to be repeated with closer attention to evidence production. Do not proceed to Tier 3 work.', null),
  (25, 44, 3, 'Score of 25 or above confirms movement to Tier 3. Proceed to the Tier 3 Implementation Kit.', 'Tier 3 Implementation Kit'),
  (45, 80, 2, 'Score of 45 or above confirms movement to Tier 2. Proceed to the Tier 2 Implementation Kit.', 'Tier 2 Implementation Kit')
) as v(score_min, score_max, resulting_tier_number, action, next_kit_title)
join kits k on k.title = 'Tier 4 Stabilization Pack'
join tiers rt on rt.tier_number = v.resulting_tier_number
left join kits nk on nk.title = v.next_kit_title
where not exists (
  select 1 from retake_bridges rb where rb.kit_id = k.id and rb.retake_score_min = v.score_min
);

insert into retake_bridges (kit_id, retake_score_min, retake_score_max, resulting_tier_id, next_step_action, next_kit_id)
select k.id, v.score_min, v.score_max, rt.id, v.action, nk.id
from (values
  (0, 24, 4, 'Score regression indicates GRID was completed more honestly on the retake. Proceed to the Tier 4 Stabilization Pack immediately. Do not attempt expansion before completing Tier 4 stabilization.', 'Tier 4 Stabilization Pack'),
  (25, 44, 3, 'Review each tool for completeness. Identify which phase produced the least evidence and revisit it. Consider a Governance Stabilization Sprint for guided implementation.', null),
  (45, 64, 2, 'Strong progress. Proceed to the Tier 2 Implementation Kit to standardize and enforce the controls now documented.', 'Tier 2 Implementation Kit'),
  (65, 80, 1, 'You are Governance-Ready. Apply for the Zytrion Governance Readiness Certification. Continue with Tier 1 maintenance for ongoing governance.', 'Tier 1 Maintenance Kit')
) as v(score_min, score_max, resulting_tier_number, action, next_kit_title)
join kits k on k.title = 'Tier 3 Implementation Kit'
join tiers rt on rt.tier_number = v.resulting_tier_number
left join kits nk on nk.title = v.next_kit_title
where not exists (
  select 1 from retake_bridges rb where rb.kit_id = k.id and rb.retake_score_min = v.score_min
);

insert into retake_bridges (kit_id, retake_score_min, retake_score_max, resulting_tier_id, next_step_action, next_kit_id)
select k.id, v.score_min, v.score_max, rt.id, v.action, nk.id
from (values
  (0, 44, 3, 'Score regression at this range indicates the audit surfaced deeper structural gaps than the kit addressed. Revisit the Tier 3 Implementation Kit and complete the foundational phases before returning to Tier 2 enforcement work.', 'Tier 3 Implementation Kit'),
  (45, 57, 2, 'Review each phase for completeness. Inconsistency audit items marked resolved but not fully enforced in practice are the most common cause of a stalled score at this range. Consider a Governance Stabilization Sprint.', null),
  (58, 64, 2, 'Strong progress, at the threshold. Review the Audit Priority Matrix and address the high-priority items not fully resolved, then retake. A targeted second retake typically resolves the remaining gap within two weeks.', null),
  (65, 80, 1, 'You are Governance-Ready. Apply for the Zytrion Governance Readiness Certification. The completed audit worksheet, Decision Log, Monthly Financial Review Log, and evidence vault are the certification evidence package.', 'Tier 1 Maintenance Kit')
) as v(score_min, score_max, resulting_tier_number, action, next_kit_title)
join kits k on k.title = 'Tier 2 Implementation Kit'
join tiers rt on rt.tier_number = v.resulting_tier_number
left join kits nk on nk.title = v.next_kit_title
where not exists (
  select 1 from retake_bridges rb where rb.kit_id = k.id and rb.retake_score_min = v.score_min
);

insert into certification_evidence_package (document_name, requirement, kit_id, package_type)
select v.document_name, v.requirement, k.id, v.package_type
from (values
  ('Post-implementation GRID result', 'Score of 65 or above on a verified retake', 'certification_evidence'),
  ('Inconsistency Audit Worksheet', 'Completed; all items addressed or documented', 'certification_evidence'),
  ('Decision Log', '90-day look-back with activity across at least 3 distinct 30-day windows and no unexplained gaps', 'certification_evidence'),
  ('Financial Traceability Worksheet', '90-day review completed', 'certification_evidence'),
  ('Monthly Financial Review Log', 'Completed, dated, and signed for the trailing 90 days', 'certification_evidence'),
  ('SOP Independence Test results', 'All SOPs tested; failures resolved', 'certification_evidence'),
  ('Evidence Layer Checklist', 'All items marked Current or Complete', 'certification_evidence')
) as v(document_name, requirement, package_type)
join kits k on k.title = 'Tier 1 Maintenance Kit'
where not exists (
  select 1 from certification_evidence_package cep
  where cep.kit_id = k.id and cep.document_name = v.document_name
);

commit;
