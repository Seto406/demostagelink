-- Migration: Create get_admin_user_list RPC
-- Description: Allows admins to fetch a paginated list of users including email and group name via left join on profiles.

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

GRANT EXECUTE ON FUNCTION public.get_admin_user_list(INTEGER, INTEGER) TO authenticated;
