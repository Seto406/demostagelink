-- Fix Favorites RLS
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;

CREATE POLICY "Users can add their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can remove their own favorites"
ON public.favorites FOR DELETE
USING (user_id IN (SELECT id FROM public.profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (user_id IN (SELECT id FROM public.profiles WHERE profiles.user_id = auth.uid()));


-- Fix Notifications RLS
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id IN (SELECT id FROM public.profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id IN (SELECT id FROM public.profiles WHERE profiles.user_id = auth.uid()));


-- Add Review Deletion RLS for Producers
DROP POLICY IF EXISTS "Producers can delete reviews of their shows" ON public.reviews;

CREATE POLICY "Producers can delete reviews of their shows"
ON public.reviews FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.shows
    WHERE shows.id = reviews.show_id
    AND shows.producer_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);
