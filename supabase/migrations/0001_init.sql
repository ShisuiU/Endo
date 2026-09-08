-- endo — schéma initial
-- Comptes strictement privés : chaque utilisateur ne voit que ses propres
-- données (RLS sur user_id = auth.uid()), pas de partage entre comptes en V1.

create extension if not exists "pgcrypto";

-- Profil léger, créé automatiquement à l'inscription (trigger plus bas).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: lecture de son propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: mise à jour de son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Une ligne par jour et par utilisateur : le "récap du jour".
create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,

  had_crisis boolean not null default false,
  crisis_intensity smallint check (crisis_intensity between 0 and 10),

  pain_score smallint check (pain_score between 0 and 10),
  sleep_score smallint check (sleep_score between 0 and 10),
  mood_score smallint check (mood_score between 0 and 10),
  energy_score smallint check (energy_score between 0 and 10),

  medication_taken boolean not null default false,
  medication_notes text,

  foods text[] not null default '{}',
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint daily_entries_user_date_unique unique (user_id, entry_date)
);

alter table public.daily_entries enable row level security;

create index if not exists daily_entries_user_date_idx
  on public.daily_entries (user_id, entry_date desc);

create policy "daily_entries: propriétaire uniquement (lecture)"
  on public.daily_entries for select
  using (auth.uid() = user_id);

create policy "daily_entries: propriétaire uniquement (création)"
  on public.daily_entries for insert
  with check (auth.uid() = user_id);

create policy "daily_entries: propriétaire uniquement (mise à jour)"
  on public.daily_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_entries: propriétaire uniquement (suppression)"
  on public.daily_entries for delete
  using (auth.uid() = user_id);

-- updated_at automatique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger daily_entries_set_updated_at
  before update on public.daily_entries
  for each row
  execute function public.set_updated_at();

-- Création automatique du profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
