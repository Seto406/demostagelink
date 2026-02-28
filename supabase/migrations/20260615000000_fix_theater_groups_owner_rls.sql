-- Ensure theater_groups ownership checks map auth.users -> profiles.id
ALTER TABLE public.theater_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own theater_groups." ON public.theater_groups;
DROP POLICY IF EXISTS "Users can update own theater_groups." ON public.theater_groups;
DROP POLICY IF EXISTS "Owners can update theater groups" ON public.theater_groups;

CREATE POLICY "Users can insert their own theater_groups." ON public.theater_groups
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id IN (
    SELECT p.id
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own theater_groups." ON public.theater_groups
FOR UPDATE
TO authenticated
USING (
  owner_id IN (
    SELECT p.id
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  owner_id IN (
    SELECT p.id
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
  )
);
