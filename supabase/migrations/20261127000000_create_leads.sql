-- Emails collected from the free resume check on the landing page.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'resume_check',
  score smallint check (score between 0 and 100),
  created_at timestamptz not null default now()
);

-- RLS on with no policies: only the server (secret key) can read or write.
alter table public.leads enable row level security;
