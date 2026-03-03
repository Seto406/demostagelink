-- Migration: Include username in admin user list RPC payload
-- Description: Adds profiles.username to the get_admin_user_list response so admin UI can show usernames.

DROP FUNCTION IF EXISTS public.get_admin_user_list(INTEGER, INTEGER);

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
  IF session_user = 'authenticator' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;

  v_offset := (page_number - 1) * page_size;

  SELECT COUNT(*) INTO v_total_count FROM auth.users;

  SELECT json_agg(t) INTO v_users
  FROM (
    SELECT
      p.id as id,
      u.id as user_id,
      p.username,
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

NOTIFY pgrst, 'reload schema';
