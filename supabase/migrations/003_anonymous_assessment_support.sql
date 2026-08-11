-- Zytrion Governance Readiness Platform
-- Allows the free public Diagnostic to be taken without an account first.
-- The client submits through a server route using the service role key,
-- which bypasses row level security entirely, so no new public policies
-- are needed here, only the schema change to hold contact details
-- directly on the assessment record until the client claims an account.

alter table assessments
  alter column client_id drop not null,
  add column contact_name text,
  add column contact_business text,
  add column contact_email text,
  add column contact_phone text;

create index idx_assessments_contact_email on assessments(contact_email);
