-- Add is_featured column to shows table
alter table public.shows add column if not exists is_featured boolean default false;

-- Add index on is_featured for performance
create index if not exists idx_shows_is_featured on public.shows(is_featured);

-- Reload schema cache
NOTIFY pgrst, 'reload config';
