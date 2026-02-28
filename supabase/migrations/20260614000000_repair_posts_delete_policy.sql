-- Repair delete authorization for posts by tying ownership to auth.uid() directly.
-- This policy allows any authenticated user to delete posts whose profile belongs to them,
-- including users with multiple profiles.
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Users can delete their own posts"
ON public.posts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = posts.profile_id
      AND p.user_id = auth.uid()
  )
);
