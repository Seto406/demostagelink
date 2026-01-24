create table if not exists public.show_reminders (
  id uuid default gen_random_uuid() primary key,
  show_id uuid references public.shows(id) not null,
  email text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.show_reminders enable row level security;

-- Allow public insert (for guests and users)
create policy "Enable insert for all users"
on public.show_reminders
for insert
with check (true);

-- Allow admins to view (assuming there is an admin role or similar, but for now sticking to minimal requirements)
-- Typically you'd want a policy for selecting/viewing, but the requirement is just data capture.
