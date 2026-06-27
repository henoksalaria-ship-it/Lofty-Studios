create or replace function public.lofty_normalize_company_name(input text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(coalesce(input, '')), '&', ' and ', 'g'),
          '\m(the|inc|llc|ltd|limited|co|company|plc|corp|corporation|studio|studios)\M',
          '',
          'g'
        ),
        '[^a-z0-9]+',
        ' ',
        'g'
      )
    ),
    ''
  );
$$;

create or replace function public.lofty_extract_domain(input text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(
    regexp_replace(
      split_part(
        regexp_replace(
          regexp_replace(lower(coalesce(input, '')), '^https?://', ''),
          '^www\.',
          ''
        ),
        '/',
        1
      ),
      '^.*@',
      ''
    ),
    ''
  );
$$;

alter table public.companies
  add column if not exists company_search_key text generated always as (public.lofty_normalize_company_name(company_name)) stored,
  add column if not exists domain_key text generated always as (public.lofty_extract_domain(coalesce(website, email))) stored;

alter table public.contacts
  add column if not exists email_key text generated always as (lower(nullif(btrim(email), ''))) stored,
  add column if not exists phone_key text generated always as (nullif(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '')) stored;

alter table public.deals
  add column if not exists duplicate_warning jsonb not null default '[]'::jsonb,
  add column if not exists reused_company_id uuid references public.companies(id) on delete set null,
  add column if not exists reused_contact_id uuid references public.contacts(id) on delete set null;

alter table public.website_lead_submissions
  add column if not exists duplicate_warning jsonb not null default '[]'::jsonb;

create index if not exists companies_workspace_search_key_idx
  on public.companies (workspace_id, company_search_key)
  where company_search_key is not null;

create index if not exists companies_workspace_domain_key_idx
  on public.companies (workspace_id, domain_key)
  where domain_key is not null;

create index if not exists contacts_workspace_email_key_idx
  on public.contacts (workspace_id, email_key)
  where email_key is not null;

create index if not exists contacts_workspace_phone_key_idx
  on public.contacts (workspace_id, phone_key)
  where phone_key is not null;

create index if not exists deals_workspace_company_open_idx
  on public.deals (workspace_id, company_id, stage, updated_at desc)
  where stage in ('cold_leads', 'reached_out', 'open_deals', 'ongoing_deals', 'waiting_payment');

create index if not exists deals_workspace_owner_stage_idx
  on public.deals (workspace_id, owner_id, stage, updated_at desc);

create index if not exists finance_records_workspace_deal_due_idx
  on public.finance_records (workspace_id, deal_id, due_date);

create index if not exists finance_records_workspace_created_idx
  on public.finance_records (workspace_id, created_at desc);
