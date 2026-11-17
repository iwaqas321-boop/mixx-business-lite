-- =====================================================================
-- Mixx Business Lite — database setup
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run: it drops and recreates the app's own tables (all app
-- data is lost), and never touches Supabase's auth tables.
--
-- Passwords live in Supabase Auth (auth.users). Accounts and merchant data
-- live here. Sign-up, login, password resets and checkout payments go
-- through Netlify Functions that use the secret key; the browser only
-- ever uses the publishable key, so the rules below are what protect data.
-- =====================================================================

drop table if exists public.merchant_data cascade;
drop table if exists public.accounts cascade;
drop table if exists public.platform cascade;

-- ---------- tables ----------
create table public.accounts (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           text not null default 'merchant' check (role in ('merchant','admin')),
  status         text not null default 'active'   check (status in ('active','disabled')),
  username       text not null unique check (username ~ '^[a-z0-9._-]{3,20}$'),
  email          text not null,
  owner          text not null default '',
  business       text not null default '',
  phone          text not null default '',
  city           text not null default '',
  country        text not null default '',
  plan           text not null default 'free' check (plan in ('free','pro','enterprise')),
  mdr            jsonb not null default '{}'::jsonb,   -- per-merchant MDR overrides, e.g. {"card": 2.5}
  gateway_locks  jsonb not null default '{}'::jsonb,   -- gateways the admin has switched off for this merchant
  created_at     timestamptz not null default now(),
  last_login     timestamptz
);
create unique index accounts_email_lower on public.accounts (lower(email));

-- The merchant's whole workspace as one JSON document (clients, products,
-- invoices, payment links, transactions…), same shape as the prototype.
-- "version" goes up on every save so two writers can't overwrite each other.
create table public.merchant_data (
  account_id  uuid primary key references public.accounts(id) on delete cascade,
  state       jsonb not null,
  version     integer not null default 1,
  updated_at  timestamptz not null default now()
);

-- Platform-wide settings (payment gateways and default MDR). Exactly one row.
create table public.platform (
  id          integer primary key default 1 check (id = 1),
  settings    jsonb not null,
  updated_at  timestamptz not null default now()
);
insert into public.platform (settings) values (
  '{"gateways":{"mixx":{"mdr":1.0,"enabled":true},"bank":{"mdr":0.5,"enabled":true},"card":{"mdr":2.9,"enabled":true},"paypal":{"mdr":3.4,"enabled":true}}}'
);

-- ---------- helpers ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.accounts where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create or replace function public.is_active_account(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.accounts where id = uid and status = 'active');
$$;

-- Fields a signed-in user may not change from the browser. Admins may change
-- status, plan, MDR and gateway locks; merchants may change their profile and
-- plan only. Role, username, e-mail and dates are changed server-side only
-- (requests made with the secret key have no auth.uid() and pass through).
create or replace function public.protect_account_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  new.id := old.id; new.role := old.role; new.username := old.username; new.email := old.email;
  new.created_at := old.created_at; new.last_login := old.last_login;
  if not public.is_admin() then
    new.status := old.status; new.mdr := old.mdr; new.gateway_locks := old.gateway_locks;
  end if;
  return new;
end $$;
create trigger accounts_protect before update on public.accounts
  for each row execute function public.protect_account_fields();

-- Save the signed-in merchant's workspace, but only if nobody else saved since
-- they loaded it. Returns the new version, or null on conflict / disabled account.
create or replace function public.save_state(p_state jsonb, p_version integer) returns integer
language plpgsql security invoker set search_path = public as $$
declare v integer;
begin
  update public.merchant_data
     set state = p_state, version = version + 1, updated_at = now()
   where account_id = auth.uid() and version = p_version
  returning version into v;
  return v;
end $$;

-- ---------- row-level security ----------
alter table public.accounts      enable row level security;
alter table public.merchant_data enable row level security;
alter table public.platform      enable row level security;

create policy "read own or admin"   on public.accounts for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "update own or admin" on public.accounts for update to authenticated
  using ((id = auth.uid() and status = 'active') or public.is_admin());

create policy "read own or admin" on public.merchant_data for select to authenticated
  using ((account_id = auth.uid() and public.is_active_account(account_id)) or public.is_admin());
create policy "update own"        on public.merchant_data for update to authenticated
  using (account_id = auth.uid() and public.is_active_account(account_id));

create policy "anyone reads platform" on public.platform for select to anon, authenticated using (true);
create policy "admin updates platform" on public.platform for update to authenticated using (public.is_admin());

-- Explicit grants (newer Supabase projects don't expose new tables by default)
grant usage on schema public to anon, authenticated, service_role;
grant select, update on public.accounts, public.merchant_data to authenticated;
grant select on public.platform to anon, authenticated;
grant update on public.platform to authenticated;
grant all on public.accounts, public.merchant_data, public.platform to service_role;
grant execute on function public.save_state(jsonb, integer) to authenticated;
grant execute on function public.is_admin() to authenticated;
