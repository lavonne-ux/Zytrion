-- ============================================================================
-- Zytrion Kit Portal :: Batched Migration 003
-- Certification evidence ladder, client_certifications, client_log_entries,
-- client_notifications_sent, client_kit_progress, is_certification_eligible,
-- and the supporting column and constraint changes on existing tables.
--
-- Confirmed 8/13/2026, written 8/16/2026. Executed as a single batch per
-- LaVonne's standing instruction: no incremental migrations.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. client_phase_progress.evidence_artifact_ref : text -> jsonb
-- ----------------------------------------------------------------------------

alter table client_phase_progress
  alter column evidence_artifact_ref type jsonb
  using case
    when evidence_artifact_ref is null then null
    else jsonb_build_array(
      jsonb_build_object('ref', evidence_artifact_ref, 'migrated_from', 'legacy_text')
    )
  end;

comment on column client_phase_progress.evidence_artifact_ref is
  'jsonb array of artifact references for this phase. Changed from text 8/16/2026 to support multiple artifacts per phase.';

-- ----------------------------------------------------------------------------
-- 2. certification_evidence_package : add kit_id, package_type
-- ----------------------------------------------------------------------------

alter table certification_evidence_package
  add column if not exists kit_id uuid references kits(id),
  add column if not exists package_type text
    check (package_type in ('phase_evidence', 'certification_evidence'));

comment on column certification_evidence_package.kit_id is
  'The kit this evidence requirement belongs to.';

comment on column certification_evidence_package.package_type is
  'phase_evidence = required to complete a kit_phases row. certification_evidence = required for the Tier 1 certification application itself.';

-- ----------------------------------------------------------------------------
-- 3. client_certification_submissions : add kit_id
-- ----------------------------------------------------------------------------

alter table client_certification_submissions
  add column if not exists kit_id uuid references kits(id);

alter table client_certification_submissions
  alter column kit_id set not null;

comment on column client_certification_submissions.kit_id is
  'The kit this submission belongs to. Always populated. kit_phase_id is additionally populated only for phase-level evidence submissions.';

-- ----------------------------------------------------------------------------
-- 4. maintenance_items.frequency : add semi_annual
--    Constraint name confirmed live: maintenance_items_frequency_check
-- ----------------------------------------------------------------------------

alter table maintenance_items drop constraint if exists maintenance_items_frequency_check;
alter table maintenance_items add constraint maintenance_items_frequency_check
  check (frequency in ('weekly', 'monthly', 'quarterly', 'semi_annual', 'annual'));

-- ----------------------------------------------------------------------------
-- 5. client_log_entries
-- ----------------------------------------------------------------------------

create table if not exists client_log_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null default auth.uid() references profiles(id) on delete cascade,
  kit_phase_id uuid references kit_phases(id),
  tool_id uuid references tools(id),
  domain text not null check (domain in ('decision', 'money', 'responsibility')),
  activity_type text not null,
  finding text not null,
  outcome text,
  next_action text,
  evidence_level smallint not null default 0 check (evidence_level between 0 and 3),
  evidence_artifact_ref jsonb,
  claimed_date date not null default current_date check (claimed_date <= current_date),
  created_at timestamptz not null default now(),
  corrects_entry_id uuid references client_log_entries(id),
  integrity_flag boolean not null default false,
  integrity_flag_reason text,
  constraint client_log_entries_evidence_ref_when_level_2plus
    check (evidence_level < 2 or evidence_artifact_ref is not null)
);

create index if not exists idx_log_entries_client_domain_date
  on client_log_entries (client_id, domain, claimed_date);

create index if not exists idx_log_entries_client_created
  on client_log_entries (client_id, created_at);

comment on table client_log_entries is
  'Structured, dated, in-portal record of Decision Log and Monthly Financial Review activity.';

-- ----------------------------------------------------------------------------
-- 6. Fabrication-pattern trigger
-- ----------------------------------------------------------------------------

create or replace function flag_suspicious_log_clusters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cluster_count int;
  v_date_spread int;
begin
  select count(*), (max(claimed_date) - min(claimed_date))
    into v_cluster_count, v_date_spread
  from client_log_entries
  where client_id = new.client_id
    and created_at >= now() - interval '10 minutes';

  if v_cluster_count >= 3 and v_date_spread > 14 then
    update client_log_entries
    set integrity_flag = true,
        integrity_flag_reason = trim(both '; ' from
          coalesce(integrity_flag_reason, '') || '; auto-flagged: ' ||
          v_cluster_count || ' entries created in one sitting spanning ' ||
          v_date_spread || ' claimed days')
    where client_id = new.client_id
      and created_at >= now() - interval '10 minutes';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_flag_suspicious_log_clusters on client_log_entries;
create trigger trg_flag_suspicious_log_clusters
  after insert on client_log_entries
  for each row execute function flag_suspicious_log_clusters();

-- ----------------------------------------------------------------------------
-- 7. client_certifications
-- ----------------------------------------------------------------------------

create sequence if not exists certificate_number_seq;

create or replace function generate_certificate_number()
returns text
language sql
as $$
  select 'ZIG-GRC-' || extract(year from current_date)::text || '-' ||
         lpad(nextval('certificate_number_seq')::text, 4, '0');
$$;

create table if not exists client_certifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  kit_id uuid not null references kits(id),
  certification_submission_id uuid references client_certification_submissions(id),
  certificate_number text not null unique default generate_certificate_number(),
  score_at_certification int not null check (score_at_certification between 65 and 80),
  rubric_version text not null,
  issue_date date not null default current_date,
  expiration_date date,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  issued_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  constraint client_certifications_expiration_after_issue
    check (expiration_date is null or expiration_date > issue_date)
);

create or replace function set_certificate_expiration()
returns trigger
language plpgsql
as $$
begin
  if new.expiration_date is null then
    new.expiration_date := new.issue_date + interval '1 year';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_certificate_expiration on client_certifications;
create trigger trg_set_certificate_expiration
  before insert on client_certifications
  for each row execute function set_certificate_expiration();

create index if not exists idx_certifications_client on client_certifications (client_id);

comment on table client_certifications is
  'One row per issued Zytrion Governance Readiness Certification. certificate_number format: ZIG-GRC-[YEAR]-[####], verifiable, valid 12 months.';

-- ----------------------------------------------------------------------------
-- 8. is_certification_eligible
-- ----------------------------------------------------------------------------

create or replace function is_certification_eligible(p_client_id uuid, p_kit_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ZYTRION_EVIDENCE_FLOOR constant numeric := 0.65;
  v_current_score int;
  v_window_count int;
  v_total_entries int;
  v_level2_plus int;
  v_domains_with_level3 int;
  v_unresolved_flags int;
begin
  select score into v_current_score
  from client_retakes
  where client_id = p_client_id
  order by taken_at desc
  limit 1;

  if v_current_score is null or v_current_score < 65 then
    return false;
  end if;

  select count(distinct width_bucket(
           (current_date - claimed_date)::numeric, 0, 90, 3
         ))
    into v_window_count
  from client_log_entries
  where client_id = p_client_id
    and claimed_date >= current_date - interval '90 days'
    and integrity_flag = false;

  if coalesce(v_window_count, 0) < 3 then
    return false;
  end if;

  select count(*), count(*) filter (where evidence_level >= 2)
    into v_total_entries, v_level2_plus
  from client_log_entries
  where client_id = p_client_id
    and claimed_date >= current_date - interval '90 days'
    and integrity_flag = false;

  if coalesce(v_total_entries, 0) = 0
     or (v_level2_plus::numeric / v_total_entries::numeric) < ZYTRION_EVIDENCE_FLOOR then
    return false;
  end if;

  select count(distinct domain) into v_domains_with_level3
  from client_log_entries
  where client_id = p_client_id
    and claimed_date >= current_date - interval '90 days'
    and evidence_level = 3
    and integrity_flag = false;

  if coalesce(v_domains_with_level3, 0) < 3 then
    return false;
  end if;

  select count(*) into v_unresolved_flags
  from client_log_entries
  where client_id = p_client_id
    and claimed_date >= current_date - interval '90 days'
    and integrity_flag = true;

  if coalesce(v_unresolved_flags, 0) > 0 then
    return false;
  end if;

  return true;
end;
$$;

comment on function is_certification_eligible(uuid, uuid) is
  'Database-level certification eligibility gate.';

-- ----------------------------------------------------------------------------
-- 9. RLS
-- ----------------------------------------------------------------------------

alter table client_log_entries enable row level security;

drop policy if exists log_entries_select_own on client_log_entries;
create policy log_entries_select_own on client_log_entries
  for select to authenticated
  using (client_id = auth.uid());

drop policy if exists log_entries_insert_own on client_log_entries;
create policy log_entries_insert_own on client_log_entries
  for insert to authenticated
  with check (client_id = auth.uid());

drop policy if exists cert_submission_insert_requires_eligibility on client_certification_submissions;
create policy cert_submission_insert_requires_eligibility
  on client_certification_submissions
  for insert to authenticated
  with check (
    client_id = auth.uid()
    and (
      kit_phase_id is not null
      or is_certification_eligible(auth.uid(), kit_id)
    )
  );

-- ----------------------------------------------------------------------------
-- 10. client_notifications_sent
-- ----------------------------------------------------------------------------

create table if not exists client_notifications_sent (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  notification_type text not null check (
    notification_type in ('behind_schedule', 'retake_approaching', 'certification_eligible', 'renewal_due')
  ),
  related_enrollment_id uuid references client_kit_enrollments(id),
  related_certification_id uuid references client_certifications(id),
  channel text not null default 'email',
  resend_message_id text,
  sent_at timestamptz not null default now()
);

create or replace function zytrion_immutable_date(ts timestamptz)
returns date
language sql
immutable
as $$
  select (ts at time zone 'UTC')::date;
$$;

create unique index if not exists uq_notification_per_day
  on client_notifications_sent (client_id, notification_type, (zytrion_immutable_date(sent_at)));

alter table client_notifications_sent enable row level security;

drop policy if exists notifications_select_own on client_notifications_sent;
create policy notifications_select_own on client_notifications_sent
  for select to authenticated
  using (client_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 11. client_kit_progress
-- ----------------------------------------------------------------------------

create or replace view client_kit_progress
with (security_invoker = true) as
select
  e.id as enrollment_id,
  e.client_id,
  e.kit_id,
  k.title as kit_title,
  k.duration_days,
  e.started_at,
  greatest(extract(day from now() - e.started_at)::int, 0) as days_elapsed,
  (
    select kp.phase_number from kit_phases kp
    where kp.kit_id = e.kit_id
      and kp.day_start <= extract(day from now() - e.started_at)::int + 1
    order by kp.phase_number desc
    limit 1
  ) as expected_phase,
  e.current_phase as actual_phase,
  (
    select count(*) from client_phase_progress cpp
    join kit_phases kp on kp.id = cpp.kit_phase_id
    where kp.kit_id = e.kit_id and cpp.client_id = e.client_id and cpp.status = 'complete'
  ) as phases_completed,
  (select count(*) from kit_phases kp where kp.kit_id = e.kit_id) as total_phases,
  e.status
from client_kit_enrollments e
join kits k on k.id = e.kit_id;

comment on view client_kit_progress is
  'Derived progress window. Nothing here is manually maintained.';

commit;
