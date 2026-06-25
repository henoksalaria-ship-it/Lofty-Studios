create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_workspace_owner(target_workspace_id uuid)
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

revoke all on function private.is_workspace_owner(uuid) from public;
grant execute on function private.is_workspace_owner(uuid) to authenticated;

drop policy if exists "Owners can update their workspace" on public.workspaces;

create policy "Owners can update their workspace"
on public.workspaces
for update
to authenticated
using ((select private.is_workspace_owner(id)))
with check ((select private.is_workspace_owner(id)));

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
  or (select private.is_workspace_owner(workspace_id))
);

create policy "Owners can add workspace members"
on public.workspace_members
for insert
to authenticated
with check (
  role <> 'owner'
  and (select private.is_workspace_owner(workspace_id))
);

create policy "Owners can update workspace members"
on public.workspace_members
for update
to authenticated
using (
  role <> 'owner'
  and user_id <> (select auth.uid())
  and (select private.is_workspace_owner(workspace_id))
)
with check (
  role <> 'owner'
  and (select private.is_workspace_owner(workspace_id))
);

create policy "Owners can remove workspace members"
on public.workspace_members
for delete
to authenticated
using (
  role <> 'owner'
  and user_id <> (select auth.uid())
  and (select private.is_workspace_owner(workspace_id))
);

drop function if exists public.is_workspace_owner(uuid);
