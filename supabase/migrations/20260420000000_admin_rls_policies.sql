-- Admin RLS Policies

-- Shows: Admins can view, update, and delete all shows
DROP POLICY IF EXISTS "Admins can view all shows" ON public.shows;
CREATE POLICY "Admins can view all shows" ON public.shows
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all shows" ON public.shows;
CREATE POLICY "Admins can update all shows" ON public.shows
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete all shows" ON public.shows;
CREATE POLICY "Admins can delete all shows" ON public.shows
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Producer Requests: Admins can view, update, and delete all requests
DROP POLICY IF EXISTS "Admins can view all producer requests" ON public.producer_requests;
CREATE POLICY "Admins can view all producer requests" ON public.producer_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all producer requests" ON public.producer_requests;
CREATE POLICY "Admins can update all producer requests" ON public.producer_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete all producer requests" ON public.producer_requests;
CREATE POLICY "Admins can delete all producer requests" ON public.producer_requests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Profiles: Admins can update all profiles (SELECT is public)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Theater Groups: Admins can update all theater groups (SELECT is public)
DROP POLICY IF EXISTS "Admins can update all theater groups" ON public.theater_groups;
CREATE POLICY "Admins can update all theater groups" ON public.theater_groups
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);
