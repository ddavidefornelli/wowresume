-- One row per signed-in user: the onboarding answers we tailor every resume to.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  goal text,
  situation text,
  experience text,
  role text,
  stack text[] not null default '{}',
  target_companies text[] not null default '{}',
  work_modes text[] not null default '{}',
  based_in text,
  open_to_relocate boolean not null default false,
  visa text,
  comp_min integer check (comp_min is null or comp_min between 0 and 2000000),
  search_stage text,
  blocker text,
  weekly_time text,
  github text,
  resume_text text check (resume_text is null or length(resume_text) <= 60000),
  resume_filename text,
  onboarded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Each user can read and write only their own profile.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
