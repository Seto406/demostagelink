-- Migration: Fix Foreign Key Constraint on producer_requests.user_id
-- Description: Ensures the constraint references auth.users(id) correctly and clears schema cache.

-- Drop the constraint if it exists (using the name from the error message)
ALTER TABLE public.producer_requests DROP CONSTRAINT IF EXISTS producer_requests_user_id_fkey;

-- Re-add the constraint referencing auth.users(id)
-- This ensures user_id matches the authenticated user's ID
ALTER TABLE public.producer_requests
  ADD CONSTRAINT producer_requests_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Reload schema cache to resolve potential stale definitions
NOTIFY pgrst, 'reload config';
