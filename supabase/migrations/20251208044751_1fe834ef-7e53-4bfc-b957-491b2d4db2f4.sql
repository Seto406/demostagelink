-- Create a security definer function to check if user is admin
-- This avoids infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Allow admins to view ALL shows (not just approved ones)
CREATE POLICY "Admins can view all shows"
ON public.shows
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Allow admins to update any show (for approval/rejection)
CREATE POLICY "Admins can update all shows"
ON public.shows
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Allow admins to delete any show
CREATE POLICY "Admins can delete all shows"
ON public.shows
FOR DELETE
USING (public.is_admin(auth.uid()));