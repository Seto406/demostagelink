-- Allow admins to update any show
CREATE POLICY "Admins can update any show"
ON public.shows
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow admins to delete any show
CREATE POLICY "Admins can delete any show"
ON public.shows
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
