-- Enforce that only users with role='producer' can insert shows
-- Previously, any user with a profile could theoretically insert a show if they knew their profile ID

DROP POLICY IF EXISTS "Producers can insert shows" ON public.shows;

CREATE POLICY "Producers can insert shows"
ON public.shows
FOR INSERT
WITH CHECK (
  producer_id IN (
    SELECT id FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'producer'
  )
);
