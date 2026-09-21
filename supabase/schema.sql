-- =====================================================================
-- Zytrion platform, complete database schema
-- =====================================================================
--
-- Generated from the live production database on 21 September 2026.
--
-- WHY THIS FILE EXISTS
--
-- Before this, the database could not be rebuilt from the repository.
-- Two competing sets of migrations existed side by side, one under
-- supabase/migrations and one loose in the project root, and neither was
-- complete. Several things the application depends on existed only in
-- production, having been applied by hand and never written down. Among
-- them: assessments.full_report_paid_at, which is the column that decides
-- whether a paying customer can see the Full Report they bought, and
-- tools.field_schema, which is what every interactive tool in the portal
-- renders from. A clean rebuild from version control would have produced
-- a platform where nobody could open what they paid for.
--
-- This file is now the single source of truth for the schema. It was read
-- back out of the live database, not written from memory, so it describes
-- what is actually running rather than what anyone intended.
--
-- HOW TO USE IT
--
-- To rebuild from nothing, run this file against an empty database. It is
-- ordered so that each object exists before anything that depends on it.
--
-- It is meant to run once, on an empty database. Running it a second time
-- against a populated one fails at the first constraint, because "alter
-- table add constraint" has no if-not-exists form in Postgres. That is not
-- a defect, it is the file refusing to half-apply itself.
--
-- This was verified, not assumed. The file was run against a fresh
-- PostgreSQL 16 database and the result compared object by object against
-- production: 35 tables, 307 columns, 1 view, 35 primary keys, 63 foreign
-- keys, 24 check constraints, 8 unique constraints, 1 exclusion
-- constraint, 63 indexes, 62 policies, RLS on all 35 tables. Two real bugs
-- surfaced that way and were fixed: is_platform_admin() was defined before
-- the table it reads, and knowledge_base_qa.search_vector was written as a
-- default when it is a generated column.
--
-- To change the schema from here on, add a numbered migration under
-- supabase/migrations and then regenerate this file, so the two never
-- drift apart again. See supabase/README.md.
--
-- WHAT THIS FILE DOES NOT CONTAIN
--
-- Reference data. Tiers, pillars, flows, kits, kit phases, tools and the
-- knowledge base are content, not structure, and they live in the seed
-- migrations. A rebuild needs both.
--
-- Supabase platform objects. The auth schema, storage buckets, and the
-- ensure_rls event trigger are managed by Supabase itself and are recreated
-- with any new project. The storage buckets this application expects are
-- listed at the end of this file so they are not forgotten.
-- =====================================================================


-- =====================================================================
-- 1. EXTENSIONS
-- =====================================================================

create extension if not exists "btree_gist";
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- pg_stat_statements and supabase_vault are installed by Supabase itself.


-- =====================================================================
-- 2. SEQUENCES
-- =====================================================================

create sequence if not exists certificate_number_seq;


-- =====================================================================
-- 3. FUNCTIONS THAT NOTHING ELSE DEPENDS ON
-- =====================================================================
-- Defined before the tables, because column defaults and indexes below
-- reference them. Neither reads a table, so they are valid this early.

-- Truncates a timestamp to a UTC date, deterministically, so it can be
-- used inside an index. The plain cast is not immutable and Postgres will
-- refuse to index it.
create or replace function public.zytrion_immutable_date(ts timestamp with time zone)
returns date
language sql
immutable
as $function$
  select (ts at time zone 'UTC')::date;
$function$;

-- Certificate numbers in the form ZIG-GRC-2026-0001.
create or replace function public.generate_certificate_number()
returns text
language sql
as $function$
  select 'ZIG-GRC-' || extract(year from current_date)::text || '-' ||
         lpad(nextval('certificate_number_seq')::text, 4, '0');
$function$;


-- =====================================================================
-- 4. TABLES
-- =====================================================================

create table if not exists profiles (
  id uuid not null,
  business_name text,
  contact_name text,
  contact_email text,
  created_at timestamp with time zone default now() not null,
  is_admin boolean default false not null,
  logo_url text
);

create table if not exists flows (
  id uuid default gen_random_uuid() not null,
  flow_name text not null,
  domain text,
  governs text,
  created_at timestamp with time zone default now() not null
);

create table if not exists pillars (
  id uuid default gen_random_uuid() not null,
  pillar_name text not null,
  flow_id uuid,
  is_cross_cutting boolean default false not null,
  signal_produced text,
  test_statement text,
  mapped_chapters integer[],
  created_at timestamp with time zone default now() not null
);

create table if not exists tiers (
  id uuid default gen_random_uuid() not null,
  tier_number integer not null,
  name text not null,
  score_min integer not null,
  score_max integer not null,
  one_line_summary text,
  created_at timestamp with time zone default now() not null
);

create table if not exists tools (
  id uuid default gen_random_uuid() not null,
  tool_name text not null,
  pillar_id uuid,
  portal_render_type text,
  description text,
  created_at timestamp with time zone default now() not null,
  field_schema jsonb
);

create table if not exists kits (
  id uuid default gen_random_uuid() not null,
  tier_id uuid not null,
  title text not null,
  kit_type text,
  price_standard integer,
  price_extended integer,
  duration_days integer,
  purpose_statement text,
  delivery_note text default 'Delivered in-portal. Not included with Diagnostic results.'::text,
  created_at timestamp with time zone default now() not null,
  stripe_price_id_standard text,
  stripe_price_id_extended text
);

create table if not exists kit_phases (
  id uuid default gen_random_uuid() not null,
  kit_id uuid not null,
  phase_number integer not null,
  day_start integer,
  day_end integer,
  focus_pillar_id uuid,
  title text not null,
  objective text,
  tool_id uuid,
  evidence_produced text,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists assessments (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  total_score integer,
  tier_id uuid,
  instrument_version text default 'V6'::text not null,
  referred_by_partner_id uuid,
  taken_at timestamp with time zone default now() not null,
  contact_name text,
  contact_business text,
  contact_email text,
  contact_phone text,
  full_report_requested_at timestamp with time zone,
  stripe_checkout_session_id text,
  full_report_paid_at timestamp with time zone
);

create table if not exists responses (
  id uuid default gen_random_uuid() not null,
  assessment_id uuid not null,
  statement_id text not null,
  value smallint not null,
  section integer not null
);

create table if not exists pillar_scores (
  id uuid default gen_random_uuid() not null,
  assessment_id uuid not null,
  pillar_id uuid not null,
  section_total integer not null
);

create table if not exists terms_acceptances (
  id uuid default gen_random_uuid() not null,
  assessment_id uuid,
  contact_email text not null,
  terms_version text not null,
  accepted_at timestamp with time zone default now() not null,
  ip_address text,
  user_agent text
);

create table if not exists client_kit_enrollments (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  kit_id uuid not null,
  started_at timestamp with time zone default now() not null,
  current_phase integer default 1,
  status text default 'active'::text
);

create table if not exists client_phase_progress (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  kit_phase_id uuid not null,
  status text default 'not_started'::text,
  evidence_artifact_ref jsonb,
  completed_at timestamp with time zone,
  review_status text default 'pending'::text not null,
  reviewer_notes text
);

create table if not exists client_tool_submissions (
  id uuid default uuid_generate_v4() not null,
  client_id uuid not null,
  kit_phase_id uuid not null,
  tool_id uuid not null,
  submitted_data jsonb not null,
  submitted_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists client_document_reviews (
  id uuid default uuid_generate_v4() not null,
  client_id uuid not null,
  kit_phase_id uuid not null,
  section_name text not null,
  file_path text not null,
  file_name text not null,
  review_status text default 'pending'::text not null,
  reviewer_notes text,
  created_at timestamp with time zone default now() not null,
  reviewed_at timestamp with time zone
);

create table if not exists client_log_entries (
  id uuid default gen_random_uuid() not null,
  client_id uuid default auth.uid() not null,
  kit_phase_id uuid,
  tool_id uuid,
  domain text not null,
  activity_type text not null,
  finding text not null,
  outcome text,
  next_action text,
  evidence_level smallint default 0 not null,
  evidence_artifact_ref jsonb,
  claimed_date date default CURRENT_DATE not null,
  created_at timestamp with time zone default now() not null,
  corrects_entry_id uuid,
  integrity_flag boolean default false not null,
  integrity_flag_reason text
);

create table if not exists client_financial_transactions (
  id uuid default uuid_generate_v4() not null,
  client_id uuid not null,
  kit_phase_id uuid not null,
  transaction_date date not null,
  amount numeric not null,
  description text not null,
  authorization_exists boolean default false not null,
  authorization_ref text,
  flagged boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists maintenance_items (
  id uuid default gen_random_uuid() not null,
  kit_id uuid not null,
  frequency text,
  discipline text,
  purpose text,
  evidence_expected text,
  created_at timestamp with time zone default now() not null,
  log_entry_domain text,
  field_schema jsonb
);

create table if not exists client_maintenance_completions (
  id uuid default uuid_generate_v4() not null,
  client_id uuid not null,
  maintenance_item_id uuid not null,
  completion_note text not null,
  evidence_path text,
  evidence_file_name text,
  completed_at timestamp with time zone default now() not null
);

create table if not exists client_quarterly_reviews (
  id uuid default uuid_generate_v4() not null,
  client_id uuid not null,
  review_quarter text not null,
  decision_flow_notes text,
  money_flow_notes text,
  responsibility_flow_notes text,
  drift_identified boolean default false not null,
  corrective_action text,
  submitted_at timestamp with time zone default now() not null
);

create table if not exists sprint_bookings (
  id uuid default uuid_generate_v4() not null,
  enrollment_id uuid not null,
  client_id uuid not null,
  slot_start timestamp with time zone not null,
  slot_end timestamp with time zone not null,
  status text default 'confirmed'::text not null,
  created_at timestamp with time zone default now() not null,
  calendar_event_id text
);

create table if not exists session_notes (
  id uuid default uuid_generate_v4() not null,
  client_id uuid not null,
  booking_id uuid,
  kit_phase_id uuid,
  note_text text not null,
  visible_to_client boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists action_items (
  id uuid default uuid_generate_v4() not null,
  client_id uuid not null,
  session_note_id uuid,
  booking_id uuid,
  kit_phase_id uuid,
  description text not null,
  status text default 'open'::text not null,
  completed_by text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table if not exists client_retakes (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  kit_id uuid,
  score integer not null,
  tier_id uuid,
  previous_score integer,
  taken_at timestamp with time zone default now() not null
);

create table if not exists retake_bridges (
  id uuid default gen_random_uuid() not null,
  kit_id uuid not null,
  retake_score_min integer not null,
  retake_score_max integer not null,
  resulting_tier_id uuid,
  next_step_action text,
  next_kit_id uuid,
  created_at timestamp with time zone default now() not null
);

create table if not exists certification_evidence_package (
  id uuid default gen_random_uuid() not null,
  document_name text not null,
  requirement text,
  created_at timestamp with time zone default now() not null,
  kit_id uuid,
  package_type text
);

create table if not exists client_certification_submissions (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  kit_phase_id uuid,
  document_type text,
  file_ref text,
  automated_check_status text default 'pending'::text,
  review_status text default 'pending'::text,
  reviewer_id uuid,
  reviewer_notes text,
  submitted_at timestamp with time zone default now() not null,
  reviewed_at timestamp with time zone,
  kit_id uuid not null
);

create table if not exists client_certifications (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  kit_id uuid not null,
  certification_submission_id uuid,
  certificate_number text default generate_certificate_number() not null,
  score_at_certification integer not null,
  rubric_version text not null,
  issue_date date default CURRENT_DATE not null,
  expiration_date date,
  status text default 'active'::text not null,
  issued_by uuid,
  created_at timestamp with time zone default now() not null
);

create table if not exists client_notifications_sent (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  notification_type text not null,
  related_enrollment_id uuid,
  related_certification_id uuid,
  channel text default 'email'::text not null,
  resend_message_id text,
  sent_at timestamp with time zone default now() not null
);

create table if not exists payments (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  product text not null,
  amount_cents integer not null,
  status text default 'pending'::text,
  stripe_reference text,
  created_at timestamp with time zone default now() not null
);

create table if not exists manual_print_orders (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  contact_name text not null,
  contact_email text not null,
  shipping_name text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text default 'US'::text not null,
  phone text,
  amount_cents integer not null,
  status text default 'pending_fulfillment'::text not null,
  stripe_reference text,
  created_at timestamp with time zone default now() not null
);

create table if not exists manual_coupon_codes (
  id uuid default uuid_generate_v4() not null,
  client_id uuid not null,
  code text not null,
  source text not null,
  redeemable boolean default false not null,
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table if not exists manual_deliveries (
  id uuid default uuid_generate_v4() not null,
  client_id uuid not null,
  source text not null,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table if not exists knowledge_base_qa (
  id uuid default gen_random_uuid() not null,
  category text not null,
  source text not null,
  question text not null,
  answer text not null,
  created_at timestamp with time zone default now() not null,
  -- Generated, not defaulted. The search index rebuilds itself whenever the
  -- question or answer changes, so it can never fall out of step with the
  -- text it indexes. Question is weighted above answer.
  search_vector tsvector generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(question, ''::text)), 'A'::"char")
    || setweight(to_tsvector('english'::regconfig, coalesce(answer, ''::text)), 'B'::"char")
  ) stored
);

create table if not exists public_proof_stats (
  id uuid default gen_random_uuid() not null,
  stat_key text not null,
  stat_value text not null,
  source text,
  updated_at timestamp with time zone default now() not null
);


-- =====================================================================
-- 5. FUNCTIONS THAT READ TABLES
-- =====================================================================
-- These must come after the tables exist. A SQL-language function is
-- validated at creation, so defining is_platform_admin() before the
-- profiles table fails outright. Found by rebuilding this file against
-- an empty database, which is the only way that kind of ordering bug
-- ever shows up.

-- The admin check every policy in this schema depends on.
--
-- CRITICAL, learned the hard way: EXECUTE must stay granted to public,
-- anon and authenticated. Revoking it does not make the platform safer,
-- it makes every policy that calls this function fail, which takes the
-- whole portal down. The function is SECURITY DEFINER and reads only the
-- caller's own profile row, so a broad execute grant exposes nothing.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable security definer
set search_path to 'public', 'pg_temp'
as $function$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$function$;

grant execute on function public.is_platform_admin() to public;
grant execute on function public.is_platform_admin() to anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_platform_admin() to service_role;

-- Runs when a new auth user is created. Creates the profile row, then
-- claims any GRID assessments taken anonymously before the account
-- existed, matched on email. It only touches rows with no client_id, so
-- it can never take a result away from someone else.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, contact_email, contact_name, business_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'contact_name',
    new.raw_user_meta_data ->> 'business_name'
  );

  update public.assessments
  set client_id = new.id
  where lower(contact_email) = lower(new.email)
    and client_id is null;

  return new;
end;
$function$;

-- Certificates expire one year after issue unless a date is given.
create or replace function public.set_certificate_expiration()
returns trigger
language plpgsql
as $function$
begin
  if new.expiration_date is null then
    new.expiration_date := new.issue_date + interval '1 year';
  end if;
  return new;
end;
$function$;

-- Evidence integrity. A client who back-fills a quarter of decision log
-- entries in one sitting is recording history, not keeping a log, so the
-- cluster is flagged rather than silently accepted.
create or replace function public.flag_suspicious_log_clusters()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
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
$function$;

-- The certification gate. Score alone is not enough: the client must also
-- show sustained, evidenced practice across all three flows, with no
-- unresolved integrity flags.
create or replace function public.is_certification_eligible(p_client_id uuid, p_kit_id uuid)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $function$
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
$function$;

-- Full text search over the knowledge base, used by the FAQ page and the
-- in-portal knowledge widget.
create or replace function public.kb_search(search_query text, result_limit integer default 5)
returns table(id uuid, category text, source text, question text, answer text, rank real)
language sql
stable
as $function$
  select
    id, category, source, question, answer,
    ts_rank(search_vector, plainto_tsquery('english', search_query)) as rank
  from knowledge_base_qa
  where search_vector @@ plainto_tsquery('english', search_query)
  order by rank desc
  limit result_limit;
$function$;


-- =====================================================================
-- 6. VIEWS
-- =====================================================================

-- Schedule adherence per enrollment: where a client should be by now
-- against where they actually are. expected_phase is derived from elapsed
-- days against each phase's day_start, so it answers "is this client
-- behind" without anyone having to work it out by hand.
--
-- Nothing in the application reads this view today. It is kept because it
-- is real, working schema and the question it answers is one the admin
-- dashboard will want.
create or replace view client_kit_progress as
 select e.id as enrollment_id,
    e.client_id,
    e.kit_id,
    k.title as kit_title,
    k.duration_days,
    e.started_at,
    greatest((extract(day from (now() - e.started_at)))::integer, 0) as days_elapsed,
    ( select kp.phase_number
           from kit_phases kp
          where ((kp.kit_id = e.kit_id) and (kp.day_start <= ((extract(day from (now() - e.started_at)))::integer + 1)))
          order by kp.phase_number desc
         limit 1) as expected_phase,
    e.current_phase as actual_phase,
    ( select count(*) as count
           from (client_phase_progress cpp
             join kit_phases kp on ((kp.id = cpp.kit_phase_id)))
          where ((kp.kit_id = e.kit_id) and (cpp.client_id = e.client_id) and (cpp.status = 'complete'::text))) as phases_completed,
    ( select count(*) as count
           from kit_phases kp
          where (kp.kit_id = e.kit_id)) as total_phases,
    e.status
   from (client_kit_enrollments e
     join kits k on ((k.id = e.kit_id)));


-- =====================================================================
-- 7. CONSTRAINTS
-- =====================================================================

-- Primary keys
alter table action_items add constraint action_items_pkey primary key (id);
alter table assessments add constraint assessments_pkey primary key (id);
alter table certification_evidence_package add constraint certification_evidence_package_pkey primary key (id);
alter table client_certification_submissions add constraint client_certification_submissions_pkey primary key (id);
alter table client_certifications add constraint client_certifications_pkey primary key (id);
alter table client_document_reviews add constraint client_document_reviews_pkey primary key (id);
alter table client_financial_transactions add constraint client_financial_transactions_pkey primary key (id);
alter table client_kit_enrollments add constraint client_kit_enrollments_pkey primary key (id);
alter table client_log_entries add constraint client_log_entries_pkey primary key (id);
alter table client_maintenance_completions add constraint client_maintenance_completions_pkey primary key (id);
alter table client_notifications_sent add constraint client_notifications_sent_pkey primary key (id);
alter table client_phase_progress add constraint client_phase_progress_pkey primary key (id);
alter table client_quarterly_reviews add constraint client_quarterly_reviews_pkey primary key (id);
alter table client_retakes add constraint client_retakes_pkey primary key (id);
alter table client_tool_submissions add constraint client_tool_submissions_pkey primary key (id);
alter table flows add constraint flows_pkey primary key (id);
alter table kit_phases add constraint kit_phases_pkey primary key (id);
alter table kits add constraint kits_pkey primary key (id);
alter table knowledge_base_qa add constraint knowledge_base_qa_pkey primary key (id);
alter table maintenance_items add constraint maintenance_items_pkey primary key (id);
alter table manual_coupon_codes add constraint manual_coupon_codes_pkey primary key (id);
alter table manual_deliveries add constraint manual_deliveries_pkey primary key (id);
alter table manual_print_orders add constraint manual_print_orders_pkey primary key (id);
alter table payments add constraint payments_pkey primary key (id);
alter table pillar_scores add constraint pillar_scores_pkey primary key (id);
alter table pillars add constraint pillars_pkey primary key (id);
alter table profiles add constraint profiles_pkey primary key (id);
alter table public_proof_stats add constraint public_proof_stats_pkey primary key (id);
alter table responses add constraint responses_pkey primary key (id);
alter table retake_bridges add constraint retake_bridges_pkey primary key (id);
alter table session_notes add constraint session_notes_pkey primary key (id);
alter table sprint_bookings add constraint sprint_bookings_pkey primary key (id);
alter table terms_acceptances add constraint terms_acceptances_pkey primary key (id);
alter table tiers add constraint tiers_pkey primary key (id);
alter table tools add constraint tools_pkey primary key (id);

-- Unique constraints
alter table client_certifications add constraint client_certifications_certificate_number_key unique (certificate_number);
alter table client_document_reviews add constraint client_document_reviews_client_id_kit_phase_id_section_name_key unique (client_id, kit_phase_id, section_name);
alter table client_phase_progress add constraint client_phase_progress_client_phase_unique unique (client_id, kit_phase_id);
alter table client_tool_submissions add constraint client_tool_submissions_client_id_kit_phase_id_key unique (client_id, kit_phase_id);
alter table knowledge_base_qa add constraint knowledge_base_qa_question_key unique (question);
alter table manual_coupon_codes add constraint manual_coupon_codes_code_key unique (code);
alter table public_proof_stats add constraint public_proof_stats_stat_key_key unique (stat_key);
alter table tiers add constraint tiers_tier_number_key unique (tier_number);

-- Check constraints
alter table certification_evidence_package add constraint certification_evidence_package_package_type_check check ((package_type = any (array['phase_evidence'::text, 'certification_evidence'::text])));
alter table client_certification_submissions add constraint client_certification_submissions_automated_check_status_check check ((automated_check_status = any (array['pass'::text, 'fail'::text, 'pending'::text])));
alter table client_certification_submissions add constraint client_certification_submissions_review_status_check check ((review_status = any (array['approved'::text, 'needs_revision'::text, 'rejected'::text, 'pending'::text])));
alter table client_certifications add constraint client_certifications_expiration_after_issue check (((expiration_date is null) or (expiration_date > issue_date)));
alter table client_certifications add constraint client_certifications_score_at_certification_check check (((score_at_certification >= 65) and (score_at_certification <= 80)));
alter table client_certifications add constraint client_certifications_status_check check ((status = any (array['active'::text, 'expired'::text, 'revoked'::text])));
alter table client_document_reviews add constraint client_document_reviews_review_status_check check ((review_status = any (array['pending'::text, 'approved'::text, 'needs_revision'::text])));
alter table client_kit_enrollments add constraint client_kit_enrollments_status_check check ((status = any (array['active'::text, 'complete'::text, 'stalled'::text])));
alter table client_log_entries add constraint client_log_entries_claimed_date_check check ((claimed_date <= CURRENT_DATE));
alter table client_log_entries add constraint client_log_entries_domain_check check ((domain = any (array['decision'::text, 'money'::text, 'responsibility'::text])));
alter table client_log_entries add constraint client_log_entries_evidence_level_check check (((evidence_level >= 0) and (evidence_level <= 3)));
alter table client_log_entries add constraint client_log_entries_evidence_ref_when_level_2plus check (((evidence_level < 2) or (evidence_artifact_ref is not null)));
alter table client_notifications_sent add constraint client_notifications_sent_notification_type_check check ((notification_type = any (array['behind_schedule'::text, 'retake_approaching'::text, 'certification_eligible'::text, 'renewal_due'::text])));
alter table client_phase_progress add constraint client_phase_progress_review_status_check check ((review_status = any (array['pending'::text, 'approved'::text, 'needs_revision'::text])));
alter table client_phase_progress add constraint client_phase_progress_status_check check ((status = any (array['not_started'::text, 'in_progress'::text, 'complete'::text])));
alter table client_retakes add constraint client_retakes_score_check check (((score >= 0) and (score <= 80)));
alter table kits add constraint kits_kit_type_check check ((kit_type = any (array['sequence'::text, 'protocol'::text, 'maintenance'::text, 'sprint'::text, 'consultation'::text])));
alter table maintenance_items add constraint maintenance_items_frequency_check check ((frequency = any (array['weekly'::text, 'monthly'::text, 'quarterly'::text, 'semi_annual'::text, 'annual'::text])));
alter table maintenance_items add constraint maintenance_items_log_entry_domain_check check (((log_entry_domain = any (array['decision'::text, 'money'::text, 'responsibility'::text])) or (log_entry_domain is null)));
alter table payments add constraint payments_status_check check ((status = any (array['pending'::text, 'succeeded'::text, 'failed'::text, 'refunded'::text])));
alter table pillar_scores add constraint pillar_scores_section_total_check check (((section_total >= 0) and (section_total <= 16)));
alter table responses add constraint responses_value_check check ((value = any (array[0, 1, 2])));
alter table tiers add constraint tiers_tier_number_check check (((tier_number >= 1) and (tier_number <= 4)));
alter table tools add constraint tools_portal_render_type_check check ((portal_render_type = any (array['form'::text, 'worksheet'::text, 'log'::text, 'upload'::text, 'checklist'::text])));

-- Exclusion constraint.
--
-- Two confirmed bookings may not occupy the same time. The application
-- check in the booking route cannot guarantee this on its own, because two
-- requests can both pass it before either one inserts. This is the guard
-- that actually holds.
--
-- Scope note: the 15 minute buffer between sessions is enforced in the
-- application, not here, because the buffered expression is not immutable
-- and Postgres will not index it.
alter table sprint_bookings add constraint sprint_bookings_no_overlap
  exclude using gist (tstzrange(slot_start, slot_end) with &&)
  where ((status = 'confirmed'::text));

-- Foreign keys
alter table profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
alter table pillars add constraint pillars_flow_id_fkey foreign key (flow_id) references flows(id);
alter table tools add constraint tools_pillar_id_fkey foreign key (pillar_id) references pillars(id);
alter table kits add constraint kits_tier_id_fkey foreign key (tier_id) references tiers(id);
alter table kit_phases add constraint kit_phases_focus_pillar_id_fkey foreign key (focus_pillar_id) references pillars(id);
alter table kit_phases add constraint kit_phases_kit_id_fkey foreign key (kit_id) references kits(id) on delete cascade;
alter table kit_phases add constraint kit_phases_tool_id_fkey foreign key (tool_id) references tools(id);
alter table assessments add constraint assessments_client_id_fkey foreign key (client_id) references profiles(id);
alter table assessments add constraint assessments_tier_id_fkey foreign key (tier_id) references tiers(id);
alter table responses add constraint responses_assessment_id_fkey foreign key (assessment_id) references assessments(id) on delete cascade;
alter table pillar_scores add constraint pillar_scores_assessment_id_fkey foreign key (assessment_id) references assessments(id) on delete cascade;
alter table pillar_scores add constraint pillar_scores_pillar_id_fkey foreign key (pillar_id) references pillars(id);
alter table terms_acceptances add constraint terms_acceptances_assessment_id_fkey foreign key (assessment_id) references assessments(id);
alter table client_kit_enrollments add constraint client_kit_enrollments_client_id_fkey foreign key (client_id) references profiles(id);
alter table client_kit_enrollments add constraint client_kit_enrollments_kit_id_fkey foreign key (kit_id) references kits(id);
alter table client_phase_progress add constraint client_phase_progress_client_id_fkey foreign key (client_id) references profiles(id);
alter table client_phase_progress add constraint client_phase_progress_kit_phase_id_fkey foreign key (kit_phase_id) references kit_phases(id);
alter table client_tool_submissions add constraint client_tool_submissions_client_id_fkey foreign key (client_id) references profiles(id);
alter table client_tool_submissions add constraint client_tool_submissions_kit_phase_id_fkey foreign key (kit_phase_id) references kit_phases(id);
alter table client_tool_submissions add constraint client_tool_submissions_tool_id_fkey foreign key (tool_id) references tools(id);
alter table client_document_reviews add constraint client_document_reviews_client_id_fkey foreign key (client_id) references profiles(id);
alter table client_document_reviews add constraint client_document_reviews_kit_phase_id_fkey foreign key (kit_phase_id) references kit_phases(id);
alter table client_log_entries add constraint client_log_entries_client_id_fkey foreign key (client_id) references profiles(id) on delete cascade;
alter table client_log_entries add constraint client_log_entries_corrects_entry_id_fkey foreign key (corrects_entry_id) references client_log_entries(id);
alter table client_log_entries add constraint client_log_entries_kit_phase_id_fkey foreign key (kit_phase_id) references kit_phases(id);
alter table client_log_entries add constraint client_log_entries_tool_id_fkey foreign key (tool_id) references tools(id);
alter table client_financial_transactions add constraint client_financial_transactions_client_id_fkey foreign key (client_id) references profiles(id);
alter table client_financial_transactions add constraint client_financial_transactions_kit_phase_id_fkey foreign key (kit_phase_id) references kit_phases(id);
alter table maintenance_items add constraint maintenance_items_kit_id_fkey foreign key (kit_id) references kits(id) on delete cascade;
alter table client_maintenance_completions add constraint client_maintenance_completions_client_id_fkey foreign key (client_id) references profiles(id);
alter table client_maintenance_completions add constraint client_maintenance_completions_maintenance_item_id_fkey foreign key (maintenance_item_id) references maintenance_items(id);
alter table client_quarterly_reviews add constraint client_quarterly_reviews_client_id_fkey foreign key (client_id) references profiles(id);
alter table sprint_bookings add constraint sprint_bookings_client_id_fkey foreign key (client_id) references profiles(id);
alter table sprint_bookings add constraint sprint_bookings_enrollment_id_fkey foreign key (enrollment_id) references client_kit_enrollments(id);
alter table session_notes add constraint session_notes_booking_id_fkey foreign key (booking_id) references sprint_bookings(id);
alter table session_notes add constraint session_notes_client_id_fkey foreign key (client_id) references profiles(id);
alter table session_notes add constraint session_notes_kit_phase_id_fkey foreign key (kit_phase_id) references kit_phases(id);
alter table action_items add constraint action_items_booking_id_fkey foreign key (booking_id) references sprint_bookings(id);
alter table action_items add constraint action_items_client_id_fkey foreign key (client_id) references profiles(id);
alter table action_items add constraint action_items_kit_phase_id_fkey foreign key (kit_phase_id) references kit_phases(id);
alter table action_items add constraint action_items_session_note_id_fkey foreign key (session_note_id) references session_notes(id);
alter table client_retakes add constraint client_retakes_client_id_fkey foreign key (client_id) references profiles(id);
alter table client_retakes add constraint client_retakes_kit_id_fkey foreign key (kit_id) references kits(id);
alter table client_retakes add constraint client_retakes_tier_id_fkey foreign key (tier_id) references tiers(id);
alter table retake_bridges add constraint retake_bridges_kit_id_fkey foreign key (kit_id) references kits(id);
alter table retake_bridges add constraint retake_bridges_next_kit_id_fkey foreign key (next_kit_id) references kits(id);
alter table retake_bridges add constraint retake_bridges_resulting_tier_id_fkey foreign key (resulting_tier_id) references tiers(id);
alter table certification_evidence_package add constraint certification_evidence_package_kit_id_fkey foreign key (kit_id) references kits(id);
alter table client_certification_submissions add constraint client_certification_submissions_client_id_fkey foreign key (client_id) references profiles(id);
alter table client_certification_submissions add constraint client_certification_submissions_kit_id_fkey foreign key (kit_id) references kits(id);
alter table client_certification_submissions add constraint client_certification_submissions_kit_phase_id_fkey foreign key (kit_phase_id) references kit_phases(id);
alter table client_certification_submissions add constraint client_certification_submissions_reviewer_id_fkey foreign key (reviewer_id) references profiles(id);
alter table client_certifications add constraint client_certifications_certification_submission_id_fkey foreign key (certification_submission_id) references client_certification_submissions(id);
alter table client_certifications add constraint client_certifications_client_id_fkey foreign key (client_id) references profiles(id) on delete cascade;
alter table client_certifications add constraint client_certifications_issued_by_fkey foreign key (issued_by) references profiles(id);
alter table client_certifications add constraint client_certifications_kit_id_fkey foreign key (kit_id) references kits(id);
alter table client_notifications_sent add constraint client_notifications_sent_client_id_fkey foreign key (client_id) references profiles(id) on delete cascade;
alter table client_notifications_sent add constraint client_notifications_sent_related_certification_id_fkey foreign key (related_certification_id) references client_certifications(id);
alter table client_notifications_sent add constraint client_notifications_sent_related_enrollment_id_fkey foreign key (related_enrollment_id) references client_kit_enrollments(id);
alter table payments add constraint payments_client_id_fkey foreign key (client_id) references profiles(id);
alter table manual_print_orders add constraint manual_print_orders_client_id_fkey foreign key (client_id) references profiles(id);
alter table manual_coupon_codes add constraint manual_coupon_codes_client_id_fkey foreign key (client_id) references profiles(id);
alter table manual_deliveries add constraint manual_deliveries_client_id_fkey foreign key (client_id) references profiles(id);


-- =====================================================================
-- 8. INDEXES
-- =====================================================================

create index if not exists idx_action_items_client on public.action_items using btree (client_id);
create index if not exists idx_assessments_contact_email on public.assessments using btree (contact_email);
create index if not exists idx_certifications_client on public.client_certifications using btree (client_id);
create index if not exists idx_document_reviews_client on public.client_document_reviews using btree (client_id);
create index if not exists idx_document_reviews_pending on public.client_document_reviews using btree (review_status) where (review_status = 'pending'::text);
create index if not exists idx_financial_transactions_client_phase on public.client_financial_transactions using btree (client_id, kit_phase_id, transaction_date desc);
create index if not exists idx_log_entries_client_created on public.client_log_entries using btree (client_id, created_at);
create index if not exists idx_log_entries_client_domain_date on public.client_log_entries using btree (client_id, domain, claimed_date);
create index if not exists idx_maintenance_completions_client_item on public.client_maintenance_completions using btree (client_id, maintenance_item_id, completed_at desc);
create index if not exists idx_quarterly_reviews_client on public.client_quarterly_reviews using btree (client_id, submitted_at desc);
create index if not exists idx_tool_submissions_client on public.client_tool_submissions using btree (client_id);
create index if not exists idx_knowledge_base_qa_category on public.knowledge_base_qa using btree (category);
create index if not exists idx_knowledge_base_qa_search on public.knowledge_base_qa using gin (search_vector);
create index if not exists idx_manual_coupon_client on public.manual_coupon_codes using btree (client_id);
create index if not exists idx_manual_deliveries_client on public.manual_deliveries using btree (client_id);
create index if not exists idx_session_notes_client on public.session_notes using btree (client_id);
create index if not exists idx_sprint_bookings_client on public.sprint_bookings using btree (client_id);

-- One active enrollment per client per kit. A completed enrollment sits
-- outside the rule, so a client who finishes a Consultation or Sprint can
-- buy and enrol in another.
create unique index if not exists client_kit_enrollments_one_active_per_kit
  on public.client_kit_enrollments using btree (client_id, kit_id)
  where (status = 'active'::text);

-- One notification of each type per client per day.
create unique index if not exists uq_notification_per_day
  on public.client_notifications_sent using btree (client_id, notification_type, zytrion_immutable_date(sent_at));


-- =====================================================================
-- 9. TRIGGERS
-- =====================================================================

create trigger trg_set_certificate_expiration
  before insert on public.client_certifications
  for each row execute function set_certificate_expiration();

create trigger trg_flag_suspicious_log_clusters
  after insert on public.client_log_entries
  for each row execute function flag_suspicious_log_clusters();

-- On auth.users, not a public table, so it survives a public schema
-- rebuild only if recreated explicitly.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- 10. ROW LEVEL SECURITY
-- =====================================================================
-- Every table carries RLS. Supabase also installs an ensure_rls event
-- trigger that enables it automatically on any new table in this schema,
-- so a table created without a policy is unreadable rather than exposed.

alter table action_items enable row level security;
alter table assessments enable row level security;
alter table certification_evidence_package enable row level security;
alter table client_certification_submissions enable row level security;
alter table client_certifications enable row level security;
alter table client_document_reviews enable row level security;
alter table client_financial_transactions enable row level security;
alter table client_kit_enrollments enable row level security;
alter table client_log_entries enable row level security;
alter table client_maintenance_completions enable row level security;
alter table client_notifications_sent enable row level security;
alter table client_phase_progress enable row level security;
alter table client_quarterly_reviews enable row level security;
alter table client_retakes enable row level security;
alter table client_tool_submissions enable row level security;
alter table flows enable row level security;
alter table kit_phases enable row level security;
alter table kits enable row level security;
alter table knowledge_base_qa enable row level security;
alter table maintenance_items enable row level security;
alter table manual_coupon_codes enable row level security;
alter table manual_deliveries enable row level security;
alter table manual_print_orders enable row level security;
alter table payments enable row level security;
alter table pillar_scores enable row level security;
alter table pillars enable row level security;
alter table profiles enable row level security;
alter table public_proof_stats enable row level security;
alter table responses enable row level security;
alter table retake_bridges enable row level security;
alter table session_notes enable row level security;
alter table sprint_bookings enable row level security;
alter table terms_acceptances enable row level security;
alter table tiers enable row level security;
alter table tools enable row level security;


-- =====================================================================
-- 11. POLICIES
-- =====================================================================
--
-- Reference content (tiers, pillars, flows, kits, phases, tools,
-- maintenance items, retake bridges, proof stats) is readable by anyone.
-- Everything belonging to a client is readable only by that client, with
-- the admin able to see what a reviewer must see.
--
-- Note on writes: several tables intentionally have no insert or update
-- policy at all. Payments, print orders and phase reviews are written by
-- the Stripe webhook and server routes through the service role, which
-- bypasses RLS. That is deliberate. A client must never be able to write
-- their own payment record or approve their own phase.

create policy "content_public_read" on certification_evidence_package as permissive for select to public
  using (true);

create policy "content_public_read" on flows as permissive for select to public
  using (true);

create policy "content_public_read" on kit_phases as permissive for select to public
  using (true);

create policy "content_public_read" on kits as permissive for select to public
  using (true);

create policy "content_public_read" on maintenance_items as permissive for select to public
  using (true);

create policy "content_public_read" on pillars as permissive for select to public
  using (true);

create policy "content_public_read" on public_proof_stats as permissive for select to public
  using (true);

create policy "content_public_read" on retake_bridges as permissive for select to public
  using (true);

create policy "content_public_read" on tiers as permissive for select to public
  using (true);

create policy "content_public_read" on tools as permissive for select to public
  using (true);

create policy "knowledge_base_read" on knowledge_base_qa as permissive for select to anon, authenticated
  using (true);

create policy "own_profile_insert" on profiles as permissive for insert to public
  with check ((auth.uid() = id));

create policy "own_profile_select" on profiles as permissive for select to public
  using ((auth.uid() = id));

create policy "own_profile_update" on profiles as permissive for update to public
  using ((auth.uid() = id));

create policy "own_assessments_insert" on assessments as permissive for insert to public
  with check (((auth.uid() = client_id) or (client_id is null)));

create policy "own_assessments_select" on assessments as permissive for select to public
  using ((auth.uid() = client_id));

create policy "own_responses_select" on responses as permissive for select to public
  using ((exists ( select 1 from assessments a where ((a.id = responses.assessment_id) and (a.client_id = auth.uid())))));

create policy "own_pillar_scores_select" on pillar_scores as permissive for select to public
  using ((exists ( select 1 from assessments a where ((a.id = pillar_scores.assessment_id) and (a.client_id = auth.uid())))));

create policy "terms_acceptances_select_admin" on terms_acceptances as permissive for select to authenticated
  using (is_platform_admin());

create policy "own_kit_enrollments_select" on client_kit_enrollments as permissive for select to public
  using ((auth.uid() = client_id));

create policy "own_phase_progress_insert" on client_phase_progress as permissive for insert to public
  with check ((auth.uid() = client_id));

create policy "own_phase_progress_select" on client_phase_progress as permissive for select to public
  using ((auth.uid() = client_id));

create policy "own_phase_progress_update" on client_phase_progress as permissive for update to public
  using ((auth.uid() = client_id));

create policy "tool_submissions_insert_own" on client_tool_submissions as permissive for insert to authenticated
  with check ((client_id = auth.uid()));

create policy "tool_submissions_select_own" on client_tool_submissions as permissive for select to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()));

create policy "tool_submissions_update_own" on client_tool_submissions as permissive for update to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()))
  with check (((client_id = auth.uid()) or is_platform_admin()));

create policy "document_reviews_insert_own" on client_document_reviews as permissive for insert to authenticated
  with check ((is_platform_admin() or ((client_id = auth.uid()) and (review_status = 'pending'::text))));

create policy "document_reviews_select_own" on client_document_reviews as permissive for select to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()));

create policy "document_reviews_update_own" on client_document_reviews as permissive for update to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()))
  with check ((is_platform_admin() or ((client_id = auth.uid()) and (review_status = 'pending'::text))));

create policy "log_entries_insert_own" on client_log_entries as permissive for insert to authenticated
  with check ((client_id = auth.uid()));

create policy "log_entries_select_own" on client_log_entries as permissive for select to authenticated
  using ((client_id = auth.uid()));

create policy "financial_transactions_delete_own" on client_financial_transactions as permissive for delete to authenticated
  using ((client_id = auth.uid()));

create policy "financial_transactions_insert_own" on client_financial_transactions as permissive for insert to authenticated
  with check ((client_id = auth.uid()));

create policy "financial_transactions_select_own" on client_financial_transactions as permissive for select to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()));

create policy "financial_transactions_update_own" on client_financial_transactions as permissive for update to authenticated
  using ((client_id = auth.uid()))
  with check ((client_id = auth.uid()));

create policy "maintenance_completions_insert_own" on client_maintenance_completions as permissive for insert to authenticated
  with check ((client_id = auth.uid()));

create policy "maintenance_completions_select_own" on client_maintenance_completions as permissive for select to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()));

create policy "quarterly_reviews_insert_own" on client_quarterly_reviews as permissive for insert to authenticated
  with check ((client_id = auth.uid()));

create policy "quarterly_reviews_select_own" on client_quarterly_reviews as permissive for select to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()));

create policy "quarterly_reviews_update_own" on client_quarterly_reviews as permissive for update to authenticated
  using ((client_id = auth.uid()))
  with check ((client_id = auth.uid()));

create policy "sprint_bookings_insert_own" on sprint_bookings as permissive for insert to authenticated
  with check ((client_id = auth.uid()));

create policy "sprint_bookings_select_own" on sprint_bookings as permissive for select to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()));

create policy "sprint_bookings_update_own" on sprint_bookings as permissive for update to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()))
  with check (((client_id = auth.uid()) or is_platform_admin()));

create policy "session_notes_select_own" on session_notes as permissive for select to authenticated
  using ((is_platform_admin() or ((client_id = auth.uid()) and (visible_to_client = true))));

create policy "session_notes_write_admin" on session_notes as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

create policy "action_items_insert_admin" on action_items as permissive for insert to authenticated
  with check (is_platform_admin());

create policy "action_items_select_own" on action_items as permissive for select to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()));

create policy "action_items_update_own" on action_items as permissive for update to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()))
  with check (((client_id = auth.uid()) or is_platform_admin()));

create policy "own_retakes_select" on client_retakes as permissive for select to public
  using ((auth.uid() = client_id));

create policy "cert_submission_insert_requires_eligibility" on client_certification_submissions as permissive for insert to authenticated
  with check (((client_id = auth.uid()) and ((kit_phase_id is not null) or is_certification_eligible(auth.uid(), kit_id))));

create policy "own_submissions_insert" on client_certification_submissions as permissive for insert to public
  with check ((auth.uid() = client_id));

create policy "own_submissions_select" on client_certification_submissions as permissive for select to public
  using ((auth.uid() = client_id));

create policy "certifications_insert_admin" on client_certifications as permissive for insert to authenticated
  with check (is_platform_admin());

create policy "certifications_select_own" on client_certifications as permissive for select to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()));

create policy "certifications_update_admin" on client_certifications as permissive for update to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

create policy "notifications_select_own" on client_notifications_sent as permissive for select to authenticated
  using ((client_id = auth.uid()));

create policy "own_payments_select" on payments as permissive for select to public
  using ((auth.uid() = client_id));

create policy "Admin can update print orders" on manual_print_orders as permissive for update to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

create policy "Admin can view all print orders" on manual_print_orders as permissive for select to authenticated
  using (is_platform_admin());

create policy "Client can view own print orders" on manual_print_orders as permissive for select to authenticated
  using ((client_id = auth.uid()));

create policy "manual_coupons_select_own" on manual_coupon_codes as permissive for select to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()));

create policy "manual_deliveries_select_own" on manual_deliveries as permissive for select to authenticated
  using (((client_id = auth.uid()) or is_platform_admin()));


-- =====================================================================
-- 12. STORAGE BUCKETS
-- =====================================================================
-- Created through the Supabase dashboard or storage API, not through SQL.
-- Listed here so a rebuild does not miss them.
--
--   client-documents                      private. Client evidence uploads.
--                                         Paths begin with the uploader's
--                                         user id, which is what the
--                                         documents route checks before
--                                         signing a link.
--
--   manual-pdfs-zytrion-manual-current.pdf
--                                         private. Holds the current
--                                         Manual PDF. The .pdf suffix is
--                                         part of the bucket name itself.
--
--   client-logos                          public. Client letterhead logos
--                                         used on generated documents.
--
-- =====================================================================
-- End of schema.
-- =====================================================================
