alter table public.profiles
  add column if not exists x_url text,
  add column if not exists tiktok_url text;

