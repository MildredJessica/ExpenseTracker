-- ============================================================
-- Expensify Fullstack — Supabase schema
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── expenses ─────────────────────────────────────────────────
create table if not exists public.expenses (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text not null,
  amount      numeric(12, 2) not null check (amount > 0),
  description text not null,
  category    text not null default 'other',
  date        date not null,
  merchant    text,
  receipt_url text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists expenses_user_id_idx on public.expenses (user_id);
create index if not exists expenses_date_idx    on public.expenses (date desc);
create index if not exists expenses_category_idx on public.expenses (user_id, category);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists expenses_updated_at on public.expenses;
create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function public.handle_updated_at();

-- RLS (server uses service-role key which bypasses RLS,
--      but enabling it protects against accidental direct access)
alter table public.expenses enable row level security;

-- ── budgets ──────────────────────────────────────────────────
create table if not exists public.budgets (
  id            uuid primary key default uuid_generate_v4(),
  user_id       text not null,
  category      text not null,
  monthly_limit numeric(12, 2) not null check (monthly_limit > 0),
  created_at    timestamptz not null default now(),
  unique (user_id, category)
);

create index if not exists budgets_user_id_idx on public.budgets (user_id);
alter table public.budgets enable row level security;

-- ── receipts storage ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict do nothing;
