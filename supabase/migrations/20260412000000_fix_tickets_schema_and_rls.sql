-- Migration to fix tickets table schema and RLS
-- This ensures tickets.user_id references profiles.id and has correct policies

-- 1. Drop existing constraint to allow data migration
-- Drop regardless of name just in case
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;

-- 2. Handle data migration if needed
-- If user_id currently holds Auth IDs (referencing auth.users), convert them to Profile IDs
DO $$
BEGIN
    -- Check if we need to migrate data.
    -- We try to update tickets where user_id matches a profile's user_id (Auth ID).
    -- This assumes that if it matches an Auth ID, it is indeed an Auth ID.
    UPDATE public.tickets t
    SET user_id = p.id
    FROM public.profiles p
    WHERE t.user_id = p.user_id;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore errors if columns don't exist or other issues
END $$;

-- 3. Fix Foreign Key
-- We need to ensure the user_id column is compatible with profiles.id (UUID). It should be already.
ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- 4. Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 5. Drop old/incorrect policies
DROP POLICY IF EXISTS "Users can insert their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Producers can view tickets for their shows" ON public.tickets;

-- 6. Create correct policies

-- Users can insert their own tickets
-- user_id in ticket must match the profile id of the auth user
CREATE POLICY "Users can insert their own tickets"
ON public.tickets FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
ON public.tickets FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Producers can view tickets for their shows
CREATE POLICY "Producers can view tickets for their shows"
ON public.tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shows
    WHERE id = tickets.show_id
    AND producer_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- 7. Reload schema cache to ensure policies take effect immediately
NOTIFY pgrst, 'reload config';
