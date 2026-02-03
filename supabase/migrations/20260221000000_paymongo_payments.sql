create table public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  paymongo_checkout_id text not null, -- The ID from PayMongo
  amount integer not null, -- stored in centavos (e.g., 10000 = 100.00 PHP)
  status text default 'pending', -- pending, paid, failed
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS: Users can see their own payments
alter table public.payments enable row level security;
create policy "View own payments" on public.payments
  for select using (auth.uid() = user_id);
