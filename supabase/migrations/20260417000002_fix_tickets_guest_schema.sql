-- Ensure tickets table supports guest checkouts
ALTER TABLE IF EXISTS public.tickets ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Ensure payments table supports guest checkouts (just in case)
ALTER TABLE IF EXISTS public.payments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.payments ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE IF EXISTS public.payments ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Reload schema cache to ensure PostgREST picks up the changes immediately
NOTIFY pgrst, 'reload schema';
