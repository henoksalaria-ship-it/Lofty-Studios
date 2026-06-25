create table public.finance_goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  goal_type text not null default 'cash_flow' check (goal_type in ('cash_flow', 'revenue', 'collections', 'expense_control', 'savings', 'pipeline')),
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  period_start date not null default current_date,
  period_end date not null,
  status text not null default 'active' check (status in ('active', 'paused', 'complete', 'archived')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create index finance_goals_workspace_status_period_idx
  on public.finance_goals (workspace_id, status, period_start, period_end);

create index finance_goals_created_by_idx
  on public.finance_goals (created_by);

create trigger finance_goals_updated_at
  before update on public.finance_goals
  for each row execute procedure public.set_updated_at();

alter table public.finance_goals enable row level security;

create policy "Finance roles can read finance goals"
on public.finance_goals
for select
to authenticated
using ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[])));

create policy "Finance roles can create finance goals"
on public.finance_goals
for insert
to authenticated
with check ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[])));

create policy "Finance roles can update finance goals"
on public.finance_goals
for update
to authenticated
using ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[])))
with check ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[])));

create policy "Finance roles can delete finance goals"
on public.finance_goals
for delete
to authenticated
using ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[])));

grant select, insert, update, delete on public.finance_goals to authenticated;
