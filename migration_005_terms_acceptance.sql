-- Logs every GRID/ZAID Terms of Use acceptance as an immutable,
-- server-assigned record. No public read policy: this is an
-- evidence log, not user-facing content. Only the service role,
-- used server-side by the assessment submit route, can write to it.

create table if not exists terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessments(id),
  contact_email text not null,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

alter table terms_acceptances enable row level security;
