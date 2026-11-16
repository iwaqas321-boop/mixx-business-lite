-- =====================================================================
-- Mixx Business Lite — Stage 2 (Supabase) starter schema
-- Run in Supabase → SQL editor. Then replace the bodies of the Store.*
-- functions in app/store.js with supabase-js calls (same names, same
-- return shapes). app.js and admin.js stay unchanged.
--
-- Passwords are NOT stored here: Supabase Auth (auth.users) handles
-- sign-up, login, password reset e-mails and sessions.
-- =====================================================================

-- One row per account (merchant or admin), linked to Supabase Auth
create table public.accounts (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'merchant' check (role in ('merchant','admin')),
  status      text not null default 'active'   check (status in ('active','disabled')),
  username    text not null unique check (username ~ '^[a-z0-9._-]{3,20}$'),
  email       text not null unique,
  owner       text not null,
  business    text not null,
  phone       text,
  city        text,
  country     text check (country in ('SN','TG','TZ')),
  plan        text not null default 'free' check (plan in ('free','pro','enterprise')),
  created_at  timestamptz not null default now(),
  last_login  timestamptz
);

-- The merchant's whole workspace as one JSON document (same shape as the
-- browser version: clients, products, invoices, paymentLinks, transactions…).
-- Split into proper tables later if reporting needs it.
create table public.merchant_data (
  account_id  uuid primary key references public.accounts(id) on delete cascade,
  state       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.accounts      enable row level security;
alter table public.merchant_data enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.accounts where id = auth.uid() and role = 'admin' and status = 'active');
$$;

-- Merchants: read/update only their own row; admins: everything
create policy "own account read"   on public.accounts for select using (id = auth.uid() or public.is_admin());
create policy "own account update" on public.accounts for update using (id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (role = 'merchant' and status = 'active'));   -- merchants can't make themselves admin or re-enable themselves
create policy "admin delete"       on public.accounts for delete using (public.is_admin());
create policy "self insert"        on public.accounts for insert with check (id = auth.uid() and role = 'merchant');

create policy "own data read"   on public.merchant_data for select using (account_id = auth.uid() or public.is_admin());
create policy "own data write"  on public.merchant_data for insert with check (account_id = auth.uid());
create policy "own data update" on public.merchant_data for update using (account_id = auth.uid());

-- Disabled accounts: block data access
create policy "block disabled" on public.merchant_data as restrictive for all
  using (exists (select 1 from public.accounts a where a.id = account_id and (a.status = 'active' or public.is_admin())));

-- First admin: sign up normally, then run once:
--   update public.accounts set role = 'admin' where email = 'you@axian-group.com';
