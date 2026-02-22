-- Fix RLS on tickets: Allow authenticated users to insert their own tickets
CREATE POLICY "Users can insert their own tickets"
ON public.tickets FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Fix Missing RPC: Grant permission and reload schema cache
GRANT EXECUTE ON FUNCTION public.add_xp(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_badge(text) TO authenticated;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload config';
