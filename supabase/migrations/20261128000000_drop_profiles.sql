-- Privacy: we no longer store onboarding answers or resumes on our servers.
-- They live only in the user's browser. This deletes every profile row already saved.
drop table if exists public.profiles;
