alter table client_phase_progress
  add column if not exists review_status text not null default 'pending'
  check (review_status in ('pending', 'approved', 'needs_revision'));

alter table client_phase_progress
  add column if not exists reviewer_notes text;
