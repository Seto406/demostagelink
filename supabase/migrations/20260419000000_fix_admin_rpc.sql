-- Migration: Fix Admin RPC functions
-- Description: Recreates get_admin_user_list and get_admin_dashboard_stats RPCs to fix 404 errors.

-- Drop existing functions to ensure clean recreation
DROP FUNCTION IF EXISTS public.get_admin_user_list(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats();

-- Create get_admin_user_list
CREATE OR REPLACE FUNCTION public.get_admin_user_list(
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_total_count BIGINT;
  v_users JSON;
BEGIN
  -- Check if user is admin (Restrict access only for API calls)
  IF session_user = 'authenticator' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;

  v_offset := (page_number - 1) * page_size;

  -- Get total count
  SELECT COUNT(*) INTO v_total_count FROM auth.users;

  SELECT json_agg(t) INTO v_users
  FROM (
    SELECT
      p.id as id, -- Profile ID (can be null if user has no profile)
      u.id as user_id, -- Auth ID
      u.email,
      COALESCE(p.role::TEXT, 'audience') as role,
      p.group_name,
      u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    ORDER BY u.created_at DESC
    LIMIT page_size
    OFFSET v_offset
  ) t;

  RETURN json_build_object(
    'users', COALESCE(v_users, '[]'::json),
    'total_count', v_total_count
  );
END;
$$;

-- Grant execute permission to authenticated users (the function itself checks for admin role)
GRANT EXECUTE ON FUNCTION public.get_admin_user_list(INTEGER, INTEGER) TO authenticated;


-- Create get_admin_dashboard_stats
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
  pending_shows integer;
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
  SELECT count(*) INTO pending_shows FROM shows WHERE status = 'pending' AND deleted_at IS NULL;
  SELECT count(*) INTO approved_shows FROM shows WHERE status = 'approved' AND deleted_at IS NULL;
  SELECT count(*) INTO rejected_shows FROM shows WHERE status = 'rejected' AND deleted_at IS NULL;

  RETURN json_build_object(
    'totalUsers', total_users,
    'totalShows', total_shows,
    'activeProducers', active_producers,
    'pendingRequests', pending_requests,
    'deletedShows', deleted_shows,
    'pendingShows', pending_shows,
    'approvedShows', approved_shows,
    'rejectedShows', rejected_shows
  );
END;
$$;

-- Grant execute permission to authenticated users (the function itself checks for admin role)
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
