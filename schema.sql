-- Ejecuta esto en Supabase: Dashboard > SQL Editor > New query > Run

create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  weight numeric,
  waist numeric,
  mood int,
  energy int,
  sleep_hours numeric,
  sleep_quality int,
  skin_tags text[],
  skin_note text,
  exercise_done boolean,
  exercise_note text,
  eating_score int,
  eating_note text,
  diary_note text,
  flow text,
  symptoms text[],
  created_at timestamptz default now(),
  unique(user_id, date)
);

create table period_starts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  unique(user_id, date)
);

create table profile (
  user_id uuid references auth.users primary key,
  foods_allowed text,
  foods_avoid text,
  medical_notes text,
  updated_at timestamptz default now()
);

alter table entries enable row level security;
alter table period_starts enable row level security;

-- Cada usuaria solo puede ver y modificar SUS propios datos
create policy "own entries" on entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own period starts" on period_starts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table profile enable row level security;

create policy "own profile" on profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
