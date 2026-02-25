-- Fix payments foreign key to reference profiles(user_id) instead of auth.users(id)
-- This allows PostgREST to join payments and profiles directly.

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(user_id)
  ON DELETE SET NULL;

-- Reload schema cache to apply changes immediately
NOTIFY pgrst, 'reload schema';
