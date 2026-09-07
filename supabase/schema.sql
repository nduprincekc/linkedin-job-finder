-- LinkedIn Job Finder — Supabase schema
-- Run this in the Supabase SQL editor. Auth uses Supabase's built-in email magic links.

create extension if not exists pgcrypto;

-- User profiles (auto-created when someone signs up)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set email = excluded.email;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Saved jobs (one row per user per job, keyed by the LinkedIn job URL)
create table if not exists public.saved_jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  job_key     text not null,
  job         jsonb not null,
  status      text not null default 'saved',   -- saved | applied | interviewing | offer | rejected
  notes       text,
  created_at  timestamptz not null default now(),
  unique (user_id, job_key)
);

-- Search history
create table if not exists public.searches (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  params        jsonb not null,
  result_count  int,
  created_at    timestamptz not null default now()
);

-- Job alerts: a saved search that n8n re-runs on a schedule
create table if not exists public.job_alerts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  params          jsonb not null,                 -- { query, location, country, dateRange, workplace, experience, jobType, easyApply }
  frequency       text not null default 'daily',  -- daily | weekly
  channel         text not null default 'email',  -- email | telegram
  email           text,
  telegram_chat_id text,
  active          boolean not null default true,
  last_run_at     timestamptz,
  last_new_count  int not null default 0,
  total_sent      int not null default 0,
  created_at      timestamptz not null default now()
);

-- Jobs already sent for an alert, so only NEW postings get delivered
create table if not exists public.alert_seen_jobs (
  alert_id      uuid not null references public.job_alerts(id) on delete cascade,
  job_key       text not null,
  first_seen_at timestamptz not null default now(),
  primary key (alert_id, job_key)
);

create index if not exists saved_jobs_user_idx on public.saved_jobs(user_id, created_at desc);
create index if not exists searches_user_idx on public.searches(user_id, created_at desc);
create index if not exists job_alerts_active_idx on public.job_alerts(active, frequency);

-- Row Level Security: users see only their own rows.
-- n8n uses the service_role key, which bypasses RLS.
alter table public.profiles        enable row level security;
alter table public.saved_jobs      enable row level security;
alter table public.searches        enable row level security;
alter table public.job_alerts      enable row level security;
alter table public.alert_seen_jobs enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "own saved jobs" on public.saved_jobs;
create policy "own saved jobs" on public.saved_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own searches" on public.searches;
create policy "own searches" on public.searches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own alerts" on public.job_alerts;
create policy "own alerts" on public.job_alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "read own alert seen jobs" on public.alert_seen_jobs;
create policy "read own alert seen jobs" on public.alert_seen_jobs
  for select using (exists (select 1 from public.job_alerts a where a.id = alert_id and a.user_id = auth.uid()));