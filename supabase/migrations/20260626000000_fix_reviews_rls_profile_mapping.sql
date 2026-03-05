-- Fix review policies to map auth users to profile IDs.
-- reviews.user_id and shows.producer_id store profile IDs, not auth user IDs.

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews"
ON public.reviews FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Producers can delete reviews of their shows" ON public.reviews;
CREATE POLICY "Producers can delete reviews of their shows"
ON public.reviews FOR DELETE
USING (
  show_id IN (
    SELECT id
    FROM public.shows
    WHERE producer_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);
