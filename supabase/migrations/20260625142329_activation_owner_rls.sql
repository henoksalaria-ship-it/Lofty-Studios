-- Activation hardening:
-- - workspace creation is server activated, not browser self-service
-- - the first activated member becomes the single Lofty owner
-- - owner can manage non-owner memberships for the upcoming role hub

create unique index if not exists workspace_members_single_owner_idx
  on public.workspace_members (role)
  where role = 'owner';

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

revoke all on function public.is_workspace_owner(uuid) from public;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

drop policy if exists "Users can create workspaces" on public.workspaces;
drop policy if exists "Owners can update workspaces" on public.workspaces;
drop policy if exists "Workspace creation is server activated only" on public.workspaces;
drop policy if exists "Owners can update their workspace" on public.workspaces;

create policy "Workspace creation is server activated only"
on public.workspaces
for insert
to authenticated
with check (false);

create policy "Owners can update their workspace"
on public.workspaces
for update
to authenticated
using ((select public.is_workspace_owner(id)))
with check ((select public.is_workspace_owner(id)));

drop policy if exists "Users can read own memberships" on public.workspace_members;
drop policy if exists "Users can create their owner membership" on public.workspace_members;
drop policy if exists "Users and owners can read memberships" on public.workspace_members;
drop policy if exists "Owners can add workspace members" on public.workspace_members;
drop policy if exists "Owners can update workspace members" on public.workspace_members;
drop policy if exists "Owners can remove workspace members" on public.workspace_members;

create policy "Users and owners can read memberships"
on public.workspace_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_workspace_owner(workspace_id))
);

create policy "Owners can add workspace members"
on public.workspace_members
for insert
to authenticated
with check (
  role <> 'owner'
  and (select public.is_workspace_owner(workspace_id))
);

create policy "Owners can update workspace members"
on public.workspace_members
for update
to authenticated
using (
  role <> 'owner'
  and user_id <> (select auth.uid())
  and (select public.is_workspace_owner(workspace_id))
)
with check (
  role <> 'owner'
  and (select public.is_workspace_owner(workspace_id))
);

create policy "Owners can remove workspace members"
on public.workspace_members
for delete
to authenticated
using (
  role <> 'owner'
  and user_id <> (select auth.uid())
  and (select public.is_workspace_owner(workspace_id))
);
