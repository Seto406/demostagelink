
-- Allow producers to view payments linked to tickets for their shows

-- Drop existing policy if it exists to avoid errors on re-run
DROP POLICY IF EXISTS "Producers view payments for their shows" ON public.payments;

-- Create the policy
CREATE POLICY "Producers view payments for their shows" ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    JOIN public.shows s ON t.show_id = s.id
    WHERE t.payment_id = payments.id
    AND s.producer_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);
