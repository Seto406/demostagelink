alter table public.profiles
add column if not exists accepting_members boolean not null default true;
