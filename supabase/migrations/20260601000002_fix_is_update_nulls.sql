-- Fix NULL values in is_update column
UPDATE public.shows
SET is_update = false
WHERE is_update IS NULL;

-- Enforce NOT NULL constraint
ALTER TABLE public.shows
ALTER COLUMN is_update SET DEFAULT false,
ALTER COLUMN is_update SET NOT NULL;

-- Update get_admin_dashboard_stats RPC function to revert debug changes and ensure robustness
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users integer;
  total_shows integer;
  active_producers integer;
  pending_requests integer;
  deleted_shows integer;
  pending_new_shows integer;
  pending_edited_shows integer;
  approved_shows integer;
  rejected_shows integer;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Execute counts
  SELECT count(*) INTO total_users FROM profiles;
  SELECT count(*) INTO total_shows FROM shows WHERE deleted_at IS NULL;
  SELECT count(*) INTO active_producers FROM profiles WHERE role = 'producer';
  SELECT count(*) INTO pending_requests FROM producer_requests WHERE status = 'pending';
  SELECT count(*) INTO deleted_shows FROM shows WHERE deleted_at IS NOT NULL;

  -- Split pending shows into new and edited
  -- Note: is_update is now NOT NULL, so no need to handle NULLs explicitly
  SELECT count(*) INTO pending_new_shows FROM shows WHERE status = 'pending' AND deleted_at IS NULL AND is_update = false;
  SELECT count(*) INTO pending_edited_shows FROM shows WHERE status = 'pending' AND deleted_at IS NULL AND is_update = true;

  SELECT count(*) INTO approved_shows FROM shows WHERE status = 'approved' AND deleted_at IS NULL;
  SELECT count(*) INTO rejected_shows FROM shows WHERE status = 'rejected' AND deleted_at IS NULL;

  RETURN json_build_object(
    'totalUsers', total_users,
    'totalShows', total_shows,
    'activeProducers', active_producers,
    'pendingRequests', pending_requests,
    'deletedShows', deleted_shows,
    'pendingNewShows', pending_new_shows,
    'pendingEditedShows', pending_edited_shows,
    'approvedShows', approved_shows,
    'rejectedShows', rejected_shows
  );
END;
$$;
