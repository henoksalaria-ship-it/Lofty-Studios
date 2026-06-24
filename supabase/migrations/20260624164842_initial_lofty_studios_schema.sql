create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'admin', 'sales', 'editor', 'finance', 'viewer');
create type public.deal_stage as enum ('cold_leads', 'reached_out', 'open_deals', 'ongoing_deals', 'waiting_payment', 'closed_won', 'lost_not_now');
create type public.lead_temperature as enum ('hot', 'warm', 'cold');
create type public.task_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.payment_status as enum ('draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled');
create type public.content_status as enum ('idea', 'scripted', 'ready_to_shoot', 'shot', 'editing', 'ready', 'posted', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_name text not null check (char_length(company_name) between 1 and 180),
  company_name_key text generated always as (lower(btrim(company_name))) stored,
  industry text,
  website text,
  instagram text,
  phone text,
  email text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, company_name_key)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  role text,
  phone text,
  email text,
  whatsapp text,
  instagram text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  primary_contact_id uuid references public.contacts(id) on delete set null,
  deal_title text not null check (char_length(deal_title) between 1 and 180),
  stage public.deal_stage not null default 'cold_leads',
  value numeric(14, 2) not null default 0 check (value >= 0),
  currency char(3) not null default 'ETB',
  probability smallint not null default 0 check (probability between 0 and 100),
  expected_close_date date,
  temperature public.lead_temperature not null default 'warm',
  source text,
  owner_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outreach_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  channel text not null check (channel in ('call', 'email', 'dm', 'whatsapp', 'meeting', 'proposal')),
  message text,
  outcome text,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  title text not null check (char_length(title) between 1 and 220),
  description text,
  script text,
  platform text,
  content_type text,
  status public.content_status not null default 'idea',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  content_idea_id uuid references public.content_ideas(id) on delete set null,
  title text not null check (char_length(title) between 1 and 220),
  event_type text not null check (event_type in ('content_post', 'youtube_upload', 'instagram_reel', 'brand_shoot', 'client_deadline', 'editing_deadline', 'meeting', 'payment_due', 'follow_up', 'campaign_launch')),
  start_date timestamptz not null,
  end_date timestamptz,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'complete', 'cancelled')),
  assigned_to uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  content_idea_id uuid references public.content_ideas(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 220),
  due_date timestamptz,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'open',
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finance_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
  remaining_amount numeric(14, 2) generated always as (greatest(total_amount - paid_amount, 0)) stored,
  currency char(3) not null default 'ETB',
  payment_status public.payment_status not null default 'draft',
  due_date timestamptz,
  invoice_number text,
  payment_method text,
  expense_amount numeric(14, 2) not null default 0 check (expense_amount >= 0),
  invoice_file_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (paid_amount <= total_amount)
);

create table public.performance_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  content_idea_id uuid references public.content_ideas(id) on delete set null,
  title text not null check (char_length(title) between 1 and 220),
  platform text not null check (platform in ('tiktok', 'instagram', 'youtube', 'facebook', 'other')),
  content_type text,
  hook_type text,
  topic text,
  views bigint not null default 0 check (views >= 0),
  likes bigint not null default 0 check (likes >= 0),
  comments bigint not null default 0 check (comments >= 0),
  shares bigint not null default 0 check (shares >= 0),
  saves bigint not null default 0 check (saves >= 0),
  watch_time_seconds numeric(14, 2) check (watch_time_seconds is null or watch_time_seconds >= 0),
  engagement_rate numeric(7, 3) not null default 0 check (engagement_rate >= 0),
  revenue_attached numeric(14, 2) not null default 0 check (revenue_attached >= 0),
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  content_idea_id uuid references public.content_ideas(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  file_name text not null,
  storage_path text not null unique,
  content_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  created_at timestamptz not null default now()
);

create table public.website_lead_submissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index deals_workspace_stage_updated_idx on public.deals (workspace_id, stage, updated_at desc);
create index deals_workspace_company_idx on public.deals (workspace_id, company_id);
create index contacts_workspace_company_idx on public.contacts (workspace_id, company_id);
create index tasks_workspace_due_open_idx on public.tasks (workspace_id, due_date) where status in ('open', 'in_progress');
create index calendar_events_workspace_start_idx on public.calendar_events (workspace_id, start_date);
create index finance_workspace_status_due_idx on public.finance_records (workspace_id, payment_status, due_date);
create index performance_workspace_posted_idx on public.performance_entries (workspace_id, posted_at desc);
create index outreach_workspace_deal_created_idx on public.outreach_logs (workspace_id, deal_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
  );
$$;

create function public.has_workspace_role(target_workspace_id uuid, allowed_roles public.workspace_role[])
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and role = any(allowed_roles)
  );
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger workspaces_updated_at before update on public.workspaces for each row execute procedure public.set_updated_at();
create trigger companies_updated_at before update on public.companies for each row execute procedure public.set_updated_at();
create trigger contacts_updated_at before update on public.contacts for each row execute procedure public.set_updated_at();
create trigger deals_updated_at before update on public.deals for each row execute procedure public.set_updated_at();
create trigger content_ideas_updated_at before update on public.content_ideas for each row execute procedure public.set_updated_at();
create trigger calendar_events_updated_at before update on public.calendar_events for each row execute procedure public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute procedure public.set_updated_at();
create trigger finance_records_updated_at before update on public.finance_records for each row execute procedure public.set_updated_at();
create trigger performance_entries_updated_at before update on public.performance_entries for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.outreach_logs enable row level security;
alter table public.content_ideas enable row level security;
alter table public.calendar_events enable row level security;
alter table public.tasks enable row level security;
alter table public.finance_records enable row level security;
alter table public.performance_entries enable row level security;
alter table public.attachments enable row level security;
alter table public.website_lead_submissions enable row level security;

create policy "Users can read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Members can read workspaces" on public.workspaces for select to authenticated using (created_by = (select auth.uid()) or (select public.is_workspace_member(id)));
create policy "Users can create workspaces" on public.workspaces for insert to authenticated with check (created_by = (select auth.uid()));
create policy "Owners can update workspaces" on public.workspaces for update to authenticated using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));

create policy "Users can read own memberships" on public.workspace_members for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can create their owner membership" on public.workspace_members for insert to authenticated with check (user_id = (select auth.uid()) and role = 'owner' and exists (select 1 from public.workspaces where id = workspace_id and created_by = (select auth.uid())));

create policy "Members can read companies" on public.companies for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "Operators can create companies" on public.companies for insert to authenticated with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));
create policy "Operators can update companies" on public.companies for update to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));
create policy "Operators can delete companies" on public.companies for delete to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));

create policy "Members can read contacts" on public.contacts for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "Operators can create contacts" on public.contacts for insert to authenticated with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));
create policy "Operators can update contacts" on public.contacts for update to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));
create policy "Operators can delete contacts" on public.contacts for delete to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));

create policy "Members can read deals" on public.deals for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "Operators can create deals" on public.deals for insert to authenticated with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));
create policy "Operators can update deals" on public.deals for update to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));
create policy "Operators can delete deals" on public.deals for delete to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));

create policy "Members can read outreach" on public.outreach_logs for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "Operators can write outreach" on public.outreach_logs for all to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));

create policy "Members can read content ideas" on public.content_ideas for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "Content operators can write ideas" on public.content_ideas for all to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));

create policy "Members can read calendar events" on public.calendar_events for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "Content operators can write calendar" on public.calendar_events for all to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));

create policy "Members can read tasks" on public.tasks for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "Operators can write tasks" on public.tasks for all to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor']::public.workspace_role[])));

create policy "Finance roles can read finance" on public.finance_records for select to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[])));
create policy "Finance roles can write finance" on public.finance_records for all to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','finance']::public.workspace_role[])));

create policy "Members can read performance" on public.performance_entries for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "Content operators can write performance" on public.performance_entries for all to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])));

create policy "Members can read attachments" on public.attachments for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "Operators can write attachments" on public.attachments for all to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor','finance']::public.workspace_role[]))) with check ((select public.has_workspace_role(workspace_id, array['owner','admin','sales','editor','finance']::public.workspace_role[])));

create policy "Operators can read website leads" on public.website_lead_submissions for select to authenticated using ((select public.has_workspace_role(workspace_id, array['owner','admin','sales']::public.workspace_role[])));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

insert into storage.buckets (id, name, public)
values ('lofty-files', 'lofty-files', false)
on conflict (id) do nothing;

create policy "Members can read Lofty files" on storage.objects for select to authenticated using (bucket_id = 'lofty-files' and (select public.is_workspace_member((storage.foldername(name))[1]::uuid)));
create policy "Operators can upload Lofty files" on storage.objects for insert to authenticated with check (bucket_id = 'lofty-files' and (select public.has_workspace_role((storage.foldername(name))[1]::uuid, array['owner','admin','sales','editor','finance']::public.workspace_role[])));
create policy "Operators can update Lofty files" on storage.objects for update to authenticated using (bucket_id = 'lofty-files' and (select public.has_workspace_role((storage.foldername(name))[1]::uuid, array['owner','admin','sales','editor','finance']::public.workspace_role[]))) with check (bucket_id = 'lofty-files' and (select public.has_workspace_role((storage.foldername(name))[1]::uuid, array['owner','admin','sales','editor','finance']::public.workspace_role[])));
create policy "Operators can delete Lofty files" on storage.objects for delete to authenticated using (bucket_id = 'lofty-files' and (select public.has_workspace_role((storage.foldername(name))[1]::uuid, array['owner','admin','sales','editor','finance']::public.workspace_role[])));
