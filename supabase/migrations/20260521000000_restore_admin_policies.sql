-- Restore missing Admin RLS Policies for Shows, Producer Requests, and Payments

-- 1. Shows
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

-- 2. Producer Requests
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

-- 3. Payments
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;
CREATE POLICY "Admins can update all payments" ON public.payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete all payments" ON public.payments;
CREATE POLICY "Admins can delete all payments" ON public.payments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
