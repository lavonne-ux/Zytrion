-- Zytrion Governance Readiness Platform
-- Seed migration: flows, pillars, tiers
-- Fixed UUIDs so application code (scoring engine) can reference these
-- rows directly without a lookup query at submission time.

insert into flows (id, flow_name, domain, governs) values
  ('c3000000-0000-0000-0000-000000000001', 'Decision Flow', 'authority', 'How decisions are made and who holds authority to make them'),
  ('c3000000-0000-0000-0000-000000000002', 'Responsibility Flow', 'ownership', 'How work is assigned, tracked, and owned to completion'),
  ('c3000000-0000-0000-0000-000000000003', 'Money Flow', 'movement', 'How funds move, are approved, and are contained within proper boundaries');

insert into pillars (id, pillar_name, flow_id, is_cross_cutting, signal_produced, test_statement, mapped_chapters) values
  ('a1000000-0000-0000-0000-000000000001', 'Authority Clarity', 'c3000000-0000-0000-0000-000000000001', false, 'Approval Speed', 'Can you name who approves a major decision in five seconds, without checking a document?', ARRAY[1,8]),
  ('a1000000-0000-0000-0000-000000000002', 'Responsibility Ownership', 'c3000000-0000-0000-0000-000000000002', false, 'Separation', 'Could the business run three days without you making every decision?', ARRAY[1,8]),
  ('a1000000-0000-0000-0000-000000000003', 'Money Containment', 'c3000000-0000-0000-0000-000000000003', false, 'Continuity', 'Do business and personal finances stay fully separated under pressure?', ARRAY[1,8]),
  ('a1000000-0000-0000-0000-000000000004', 'Evidence Integrity', null, true, 'Verification', 'Could you produce proof of a major decision to an auditor in under five minutes?', ARRAY[1,8,13]),
  ('a1000000-0000-0000-0000-000000000005', 'Governance Discipline', null, true, 'Consistency', 'Would your structure hold up under an audit, a transition, or a dispute?', ARRAY[1,8,13]);

insert into tiers (id, tier_number, name, score_min, score_max, one_line_summary) values
  ('b2000000-0000-0000-0000-000000000004', 4, 'Unstable / High Exposure', 0, 24, 'Foundational structure is missing; the business runs on memory and informal agreement rather than documented governance.'),
  ('b2000000-0000-0000-0000-000000000003', 3, 'Operational but Exposed', 25, 44, 'Core operations function, but key decisions and money movement are not consistently documented or defensible.'),
  ('b2000000-0000-0000-0000-000000000002', 2, 'Growing / Inconsistent', 45, 64, 'Governance exists in several areas but is not yet uniform; some pillars are strong while others remain informal.'),
  ('b2000000-0000-0000-0000-000000000001', 1, 'Governed / Institution-Ready', 65, 80, 'Structure, documentation, and controls are consistent enough to withstand lender, investor, or audit scrutiny.');
