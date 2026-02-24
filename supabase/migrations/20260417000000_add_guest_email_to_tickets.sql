-- Add guest email and name to tickets table to support guest checkouts
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Reload schema cache to ensure PostgREST picks up the changes immediately
NOTIFY pgrst, 'reload schema';
