-- Migration: Ensure subscription unique constraint
-- Description: Ensures user_id in subscriptions table is unique to support UPSERT operations.

-- 1. Create table if it doesn't exist (idempotent check)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(user_id) not null,
  status text check (status in ('active', 'inactive', 'past_due', 'canceled')) default 'inactive',
  tier text check (tier in ('free', 'pro')) default 'free',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Remove duplicate subscriptions, keeping the most recent one
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) as r_num
  FROM public.subscriptions
)
DELETE FROM public.subscriptions
WHERE id IN (
  SELECT id FROM duplicates WHERE r_num > 1
);

-- 3. Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_key'
    ) THEN
        ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
    END IF;
END $$;
