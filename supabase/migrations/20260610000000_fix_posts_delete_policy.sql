-- Fix delete policy for posts
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Users can delete their own posts"
ON public.posts FOR DELETE
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);
