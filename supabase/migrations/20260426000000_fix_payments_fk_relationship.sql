-- Ensure foreign key relationship between payments and profiles exists
-- This allows PostgREST to join payments and profiles on user_id

-- 1. Drop existing constraint if it exists (to handle re-runs or incorrect existing constraints)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

-- 2. Clean up any orphaned user_ids in payments that don't exist in profiles
-- This prevents the constraint creation from failing and ensures referential integrity
UPDATE public.payments
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.user_id = payments.user_id
  );

-- 3. Add the foreign key constraint referencing public.profiles(user_id)
-- Note: profiles.user_id references auth.users(id) and is unique
ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(user_id)
  ON DELETE SET NULL;

-- 4. Reload schema cache to ensure PostgREST picks up the new relationship
NOTIFY pgrst, 'reload schema';
