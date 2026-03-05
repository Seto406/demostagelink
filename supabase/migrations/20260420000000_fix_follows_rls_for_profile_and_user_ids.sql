-- Allow both auth.users.id and legacy profiles.id values for follows.follower_id.
-- Some deployments still write profile IDs into follows.follower_id while newer deployments
-- use auth user IDs directly. These policies support both without weakening authorization.

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others"
ON public.follows FOR INSERT
WITH CHECK (
  follower_id = auth.uid()
  OR follower_id IN (
    SELECT p.id
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can unfollow others" ON public.follows;
CREATE POLICY "Users can unfollow others"
ON public.follows FOR DELETE
USING (
  follower_id = auth.uid()
  OR follower_id IN (
    SELECT p.id
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
  )
);
