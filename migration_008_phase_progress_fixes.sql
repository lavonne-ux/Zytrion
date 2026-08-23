alter table client_phase_progress
  add constraint client_phase_progress_client_phase_unique unique (client_id, kit_phase_id);

create policy "own_phase_progress_insert" on client_phase_progress
  for insert with check (auth.uid() = client_id);
