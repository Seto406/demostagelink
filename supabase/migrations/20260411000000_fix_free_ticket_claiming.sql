-- Create add_xp function
CREATE OR REPLACE FUNCTION public.add_xp(amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, xp)
  VALUES (auth.uid(), amount)
  ON CONFLICT (user_id)
  DO UPDATE SET xp = user_stats.xp + EXCLUDED.xp;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.add_xp(integer) TO authenticated;

-- Ensure tickets table references profiles(id)
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;

-- We need to check if the column type matches. If user_id was UUID referencing auth.users, it is UUID.
-- profiles.id is also UUID. So type matches.
-- If user_id contains data that doesn't exist in profiles(id), this ADD CONSTRAINT will fail.
-- Assuming tickets table is empty or data is consistent (e.g. mostly empty due to errors, or only webhook inserts which use Profile ID anyway).
-- If webhook inserts use Profile ID (as per memory), then data is consistent with Profile ID.

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Enable RLS for tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Drop old/incorrect policies
DROP POLICY IF EXISTS "Users can insert their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;

-- Create correct policies
CREATE POLICY "Users can insert their own tickets"
ON public.tickets FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own tickets"
ON public.tickets FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Reload schema cache
NOTIFY pgrst, 'reload config';
