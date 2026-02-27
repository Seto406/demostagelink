-- Add is_update column to shows table (standard column, not generated)
ALTER TABLE public.shows
ADD COLUMN IF NOT EXISTS is_update BOOLEAN DEFAULT false;

-- Create function to update is_update
CREATE OR REPLACE FUNCTION public.update_show_is_update_column()
RETURNS TRIGGER AS $$
BEGIN
  -- If updated_at is more than 1 minute after created_at, mark as update
  -- Using NEW.created_at handles both insert (where they are equal) and update
  IF NEW.updated_at > (NEW.created_at + interval '1 minute') THEN
    NEW.is_update := true;
  ELSE
    NEW.is_update := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain is_update
DROP TRIGGER IF EXISTS set_show_is_update ON public.shows;
CREATE TRIGGER set_show_is_update
BEFORE INSERT OR UPDATE ON public.shows
FOR EACH ROW
EXECUTE FUNCTION public.update_show_is_update_column();

-- Backfill existing data
UPDATE public.shows
SET is_update = (updated_at > (created_at + interval '1 minute'));

-- Update get_admin_dashboard_stats RPC function
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
