-- Cover foreign keys used by joins, cascades, and RLS lookups.
create index if not exists attachments_content_idea_id_idx on public.attachments (content_idea_id);
create index if not exists attachments_deal_id_idx on public.attachments (deal_id);
create index if not exists attachments_uploaded_by_idx on public.attachments (uploaded_by);
create index if not exists attachments_workspace_id_idx on public.attachments (workspace_id);
create index if not exists calendar_events_assigned_to_idx on public.calendar_events (assigned_to);
create index if not exists calendar_events_content_idea_id_idx on public.calendar_events (content_idea_id);
create index if not exists calendar_events_deal_id_idx on public.calendar_events (deal_id);
create index if not exists contacts_company_id_idx on public.contacts (company_id);
create index if not exists content_ideas_created_by_idx on public.content_ideas (created_by);
create index if not exists content_ideas_deal_id_idx on public.content_ideas (deal_id);
create index if not exists content_ideas_workspace_id_idx on public.content_ideas (workspace_id);
create index if not exists deals_company_id_idx on public.deals (company_id);
create index if not exists deals_owner_id_idx on public.deals (owner_id);
create index if not exists deals_primary_contact_id_idx on public.deals (primary_contact_id);
create index if not exists finance_records_deal_id_idx on public.finance_records (deal_id);
create index if not exists outreach_logs_created_by_idx on public.outreach_logs (created_by);
create index if not exists outreach_logs_deal_id_idx on public.outreach_logs (deal_id);
create index if not exists performance_entries_content_idea_id_idx on public.performance_entries (content_idea_id);
create index if not exists performance_entries_deal_id_idx on public.performance_entries (deal_id);
create index if not exists tasks_assigned_to_idx on public.tasks (assigned_to);
create index if not exists tasks_content_idea_id_idx on public.tasks (content_idea_id);
create index if not exists tasks_created_by_idx on public.tasks (created_by);
create index if not exists tasks_deal_id_idx on public.tasks (deal_id);
create index if not exists website_lead_submissions_deal_id_idx on public.website_lead_submissions (deal_id);
create index if not exists website_lead_submissions_workspace_id_idx on public.website_lead_submissions (workspace_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists workspaces_created_by_idx on public.workspaces (created_by);

-- FOR ALL policies also grant SELECT. Split them into write-only policies so member read access
-- stays a single inexpensive policy per table.
drop policy if exists "Operators can write outreach" on public.outreach_logs;
create policy "Operators can create outreach" on public.outreach_logs for insert to authenticated with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));
create policy "Operators can update outreach" on public.outreach_logs for update to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));
create policy "Operators can delete outreach" on public.outreach_logs for delete to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));

drop policy if exists "Content operators can write ideas" on public.content_ideas;
create policy "Content operators can create ideas" on public.content_ideas for insert to authenticated with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));
create policy "Content operators can update ideas" on public.content_ideas for update to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));
create policy "Content operators can delete ideas" on public.content_ideas for delete to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));

drop policy if exists "Content operators can write calendar" on public.calendar_events;
create policy "Content operators can create calendar" on public.calendar_events for insert to authenticated with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));
create policy "Content operators can update calendar" on public.calendar_events for update to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));
create policy "Content operators can delete calendar" on public.calendar_events for delete to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));

drop policy if exists "Operators can write tasks" on public.tasks;
create policy "Operators can create tasks" on public.tasks for insert to authenticated with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));
create policy "Operators can update tasks" on public.tasks for update to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));
create policy "Operators can delete tasks" on public.tasks for delete to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));

drop policy if exists "Finance roles can write finance" on public.finance_records;
create policy "Finance roles can create finance" on public.finance_records for insert to authenticated with check ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[])));
create policy "Finance roles can update finance" on public.finance_records for update to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[])));
create policy "Finance roles can delete finance" on public.finance_records for delete to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[])));

drop policy if exists "Content operators can write performance" on public.performance_entries;
create policy "Content operators can create performance" on public.performance_entries for insert to authenticated with check ((select public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])));
create policy "Content operators can update performance" on public.performance_entries for update to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])));
create policy "Content operators can delete performance" on public.performance_entries for delete to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])));

drop policy if exists "Operators can write attachments" on public.attachments;
create policy "Operators can create attachments" on public.attachments for insert to authenticated with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor','finance']::public.workspace_role[])));
create policy "Operators can update attachments" on public.attachments for update to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor','finance']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor','finance']::public.workspace_role[])));
create policy "Operators can delete attachments" on public.attachments for delete to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor','finance']::public.workspace_role[])));
