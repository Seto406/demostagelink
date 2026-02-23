-- Fix payments foreign key constraint to reference auth.users(id)
-- This ensures compatibility with create-paymongo-session which uses Auth ID (not Profile ID)

-- 1. Drop existing constraint
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

-- 2. Data Migration: Convert any Profile IDs to Auth IDs
-- (In case some rows were inserted using Profile ID previously)
UPDATE public.payments p
SET user_id = pr.user_id
FROM public.profiles pr
WHERE p.user_id = pr.id;

-- 3. Data Cleanup: Set any user_id not found in auth.users to NULL
-- This prevents the FK creation from failing if invalid IDs exist
UPDATE public.payments
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM auth.users);

-- 4. Add correct foreign key constraint
ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- 5. Reload schema cache
NOTIFY pgrst, 'reload config';
