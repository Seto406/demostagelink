-- Fix payments and tickets to support Guest Checkout (NULL user_id)

-- 1. Modify payments table
ALTER TABLE public.payments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 2. Modify tickets table
ALTER TABLE public.tickets ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 3. Reload schema cache to ensure PostgREST picks up the changes
NOTIFY pgrst, 'reload config';
