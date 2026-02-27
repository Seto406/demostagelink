-- Allow Admins to View and Manage All Payments

-- Drop policies if they exist to avoid conflict on re-run
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can delete all payments" ON public.payments;

-- Create policies for Admin access
CREATE POLICY "Admins can view all payments" ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update all payments" ON public.payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete all payments" ON public.payments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
