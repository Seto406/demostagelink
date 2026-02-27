-- Migration: Fix is_update to be a trigger-based column instead of generated

-- 1. Drop the function that depends on the column
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats();

-- 2. Drop the existing generated column
ALTER TABLE public.shows DROP COLUMN IF EXISTS is_update;

-- 3. Add the column as a standard boolean
ALTER TABLE public.shows ADD COLUMN is_update BOOLEAN NOT NULL DEFAULT false;

-- 4. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_show_update_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if it's an update or insert where updated_at is significantly later than created_at
    -- We use a 1-minute buffer to allow for initial creation adjustments
    IF NEW.updated_at > (NEW.created_at + interval '1 minute') THEN
        NEW.is_update := true;
    ELSE
        NEW.is_update := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger
-- We use 'z_' prefix to ensure it runs after other triggers (like update_updated_at_column)
DROP TRIGGER IF EXISTS z_check_is_update ON public.shows;
CREATE TRIGGER z_check_is_update
BEFORE INSERT OR UPDATE ON public.shows
FOR EACH ROW
EXECUTE FUNCTION public.handle_show_update_status();

-- 6. Backfill existing data
UPDATE public.shows
SET is_update = (updated_at > (created_at + interval '1 minute'));

-- 7. Recreate get_admin_dashboard_stats
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

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
