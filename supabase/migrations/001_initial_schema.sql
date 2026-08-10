-- Zytrion Platform: Initial Schema
-- Source of truth: Zytrion_Platform_Build_Specification.docx +
-- Zytrion_Portal_Content_Architecture.md
--
-- Migrate in this order. A foreign key cannot point at a row that does not
-- yet exist, so reference/content tables are created before the
-- client-facing runtime tables that read from them.
--
-- Order: tiers -> flows -> pillars -> tools -> kits -> kit_phases ->
--        maintenance_items -> retake_bridges -> certification_evidence_package
--        -> profiles -> assessments -> responses -> pillar_scores ->
--        client_kit_enrollments -> client_phase_progress -> client_retakes ->
--        client_certification_submissions -> public_proof_stats -> payments

create extension if not exists "pgcrypto";

-- =========================================================================
-- REFERENCE / CONTENT TABLES
-- Public read (the portal renders these for every visitor). Write access
-- is service-role only; content changes go through the backend, not
-- client requests.
-- =========================================================================

create table tiers (
  id uuid primary key default gen_random_uuid(),
  tier_number int not null unique check (tier_number between 1 and 4),
  name text not null,
  score_min int not null,
  score_max int not null,
  one_line_summary text,
  created_at timestamptz not null default now()
);

create table flows (
  id uuid primary key default gen_random_uuid(),
  flow_name text not null,        -- Decision Flow, Money Flow, Responsibility Flow
  domain text,                    -- authority, movement, ownership
  governs text,
  created_at timestamptz not null default now()
);

create table pillars (
  id uuid primary key default gen_random_uuid(),
  pillar_name text not null,      -- Authority Clarity, Money Containment, Responsibility
                                   -- Ownership, Evidence Integrity, Governance Discipline
  flow_id uuid references flows(id),   -- null = cross-cutting (All Flows)
  is_cross_cutting boolean not null default false,
  signal_produced text,           -- Approval Speed, Separation, Continuity, Verification, Consistency
  test_statement text,            -- the pass test from Manual Ch 13
  mapped_chapters int[],
  created_at timestamptz not null default now()
);

create table tools (
  id uuid primary key default gen_random_uuid(),
  tool_name text not null,
  pillar_id uuid references pillars(id),
  portal_render_type text check (portal_render_type in ('form', 'worksheet', 'log', 'upload', 'checklist')),
  description text,
  created_at timestamptz not null default now()
);

create table kits (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references tiers(id),
  title text not null,
  kit_type text check (kit_type in ('protocol', 'sequence', 'maintenance')), -- protocol=T4, sequence=T3/T2, maintenance=T1
  price_standard int,      -- cents
  price_extended int,      -- cents, nullable
  duration_days int,       -- 14 / 60 / 45; null for T1 maintenance
  purpose_statement text,
  delivery_note text default 'Delivered in-portal. Not included with Diagnostic results.',
  created_at timestamptz not null default now()
);

create table kit_phases (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references kits(id) on delete cascade,
  phase_number int not null,
  day_start int,
  day_end int,
  focus_pillar_id uuid references pillars(id),
  title text not null,
  objective text,
  tool_id uuid references tools(id),
  evidence_produced text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table maintenance_items (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references kits(id) on delete cascade,
  frequency text check (frequency in ('weekly', 'monthly', 'quarterly', 'annual')),
  discipline text,
  purpose text,
  evidence_expected text,
  created_at timestamptz not null default now()
);

create table retake_bridges (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references kits(id),
  retake_score_min int not null,
  retake_score_max int not null,
  resulting_tier_id uuid references tiers(id),
  next_step_action text,
  next_kit_id uuid references kits(id),
  created_at timestamptz not null default now()
);

create table certification_evidence_package (
  id uuid primary key default gen_random_uuid(),
  document_name text not null,
  requirement text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- IDENTITY
-- =========================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text,
  contact_name text,
  contact_email text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- CLIENT-FACING RUNTIME TABLES
-- =========================================================================

create table assessments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id),   -- nullable: a diagnostic can be taken before signup
  total_score int,
  tier_id uuid references tiers(id),
  instrument_version text not null default 'V6',
  referred_by_partner_id uuid,
  taken_at timestamptz not null default now()
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  statement_id text not null,
  value smallint not null check (value in (0, 1, 2)),
  section int not null
);

create table pillar_scores (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  pillar_id uuid not null references pillars(id),
  section_total int not null check (section_total between 0 and 16)
);

create table client_kit_enrollments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  kit_id uuid not null references kits(id),
  started_at timestamptz not null default now(),
  current_phase int default 1,
  status text check (status in ('active', 'complete', 'stalled')) default 'active'
);

create table client_phase_progress (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  kit_phase_id uuid not null references kit_phases(id),
  status text check (status in ('not_started', 'in_progress', 'complete')) default 'not_started',
  evidence_artifact_ref text,
  completed_at timestamptz
);

create table client_retakes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  kit_id uuid references kits(id),
  score int not null check (score between 0 and 80),
  tier_id uuid references tiers(id),
  previous_score int,
  taken_at timestamptz not null default now()
);

create table client_certification_submissions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  kit_phase_id uuid references kit_phases(id),   -- null when the submission is for certification, not a phase
  document_type text,
  file_ref text,   -- Supabase Storage path
  automated_check_status text check (automated_check_status in ('pass', 'fail', 'pending')) default 'pending',
  review_status text check (review_status in ('approved', 'needs_revision', 'rejected', 'pending')) default 'pending',
  reviewer_id uuid references profiles(id),
  reviewer_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public_proof_stats (
  id uuid primary key default gen_random_uuid(),
  stat_key text not null unique,
  stat_value text not null,
  source text,          -- Zytrion live data, or a cited SBA/funding statistic
  updated_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id),
  product text not null,
  amount_cents int not null,
  status text check (status in ('pending', 'succeeded', 'failed', 'refunded')) default 'pending',
  stripe_reference text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- ROW LEVEL SECURITY
-- Content/reference tables: public read, service-role write only.
-- Client data tables: a user reads and writes only their own rows.
-- The service role bypasses RLS entirely for scoring, fulfillment, and
-- the national Zyndex dataset rollups.
-- =========================================================================

alter table tiers enable row level security;
alter table flows enable row level security;
alter table pillars enable row level security;
alter table tools enable row level security;
alter table kits enable row level security;
alter table kit_phases enable row level security;
alter table maintenance_items enable row level security;
alter table retake_bridges enable row level security;
alter table certification_evidence_package enable row level security;
alter table public_proof_stats enable row level security;

create policy "content_public_read" on tiers for select using (true);
create policy "content_public_read" on flows for select using (true);
create policy "content_public_read" on pillars for select using (true);
create policy "content_public_read" on tools for select using (true);
create policy "content_public_read" on kits for select using (true);
create policy "content_public_read" on kit_phases for select using (true);
create policy "content_public_read" on maintenance_items for select using (true);
create policy "content_public_read" on retake_bridges for select using (true);
create policy "content_public_read" on certification_evidence_package for select using (true);
create policy "content_public_read" on public_proof_stats for select using (true);

alter table profiles enable row level security;
create policy "own_profile_select" on profiles for select using (auth.uid() = id);
create policy "own_profile_update" on profiles for update using (auth.uid() = id);
create policy "own_profile_insert" on profiles for insert with check (auth.uid() = id);

alter table assessments enable row level security;
create policy "own_assessments_select" on assessments for select using (auth.uid() = client_id);
create policy "own_assessments_insert" on assessments for insert with check (auth.uid() = client_id or client_id is null);

alter table responses enable row level security;
create policy "own_responses_select" on responses for select using (
  exists (select 1 from assessments a where a.id = responses.assessment_id and a.client_id = auth.uid())
);

alter table pillar_scores enable row level security;
create policy "own_pillar_scores_select" on pillar_scores for select using (
  exists (select 1 from assessments a where a.id = pillar_scores.assessment_id and a.client_id = auth.uid())
);

alter table client_kit_enrollments enable row level security;
create policy "own_kit_enrollments_select" on client_kit_enrollments for select using (auth.uid() = client_id);

alter table client_phase_progress enable row level security;
create policy "own_phase_progress_select" on client_phase_progress for select using (auth.uid() = client_id);
create policy "own_phase_progress_update" on client_phase_progress for update using (auth.uid() = client_id);

alter table client_retakes enable row level security;
create policy "own_retakes_select" on client_retakes for select using (auth.uid() = client_id);

alter table client_certification_submissions enable row level security;
create policy "own_submissions_select" on client_certification_submissions for select using (auth.uid() = client_id);
create policy "own_submissions_insert" on client_certification_submissions for insert with check (auth.uid() = client_id);

alter table payments enable row level security;
create policy "own_payments_select" on payments for select using (auth.uid() = client_id);

-- Note: no INSERT/UPDATE policies are defined for the reference tables or
-- for scoring writes to assessments/pillar_scores/client_retakes/payments.
-- Those writes happen server-side through the service role client
-- (src/lib/supabase/server.ts -> createServiceRoleClient), which bypasses
-- RLS by design. The client app never writes scores directly.
