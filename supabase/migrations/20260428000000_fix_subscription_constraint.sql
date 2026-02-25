-- Migration: Fix subscription unique constraint
-- Description: Ensures user_id in subscriptions table is unique to support UPSERT operations.

-- 1. Remove duplicate subscriptions, keeping the most recent one
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) as r_num
  FROM public.subscriptions
)
DELETE FROM public.subscriptions
WHERE id IN (
  SELECT id FROM duplicates WHERE r_num > 1
);

-- 2. Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_key'
    ) THEN
        ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
    END IF;
END $$;
