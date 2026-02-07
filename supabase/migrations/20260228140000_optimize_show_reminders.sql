-- Migration: Add function to batch fetch user emails for show reminders
-- Purpose: Resolve N+1 query issue in send-show-reminder edge function

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids UUID[])
RETURNS TABLE (user_id UUID, email TEXT)
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- This function is intended to be called by service_role only
  -- It returns emails which are sensitive information

  RETURN QUERY
  SELECT id as user_id, auth.users.email::TEXT
  FROM auth.users
  WHERE id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;

-- Revoke execution from public to prevent unauthorized access
REVOKE EXECUTE ON FUNCTION public.get_user_emails(UUID[]) FROM PUBLIC;

-- Grant execution to service_role (used by Edge Functions)
GRANT EXECUTE ON FUNCTION public.get_user_emails(UUID[]) TO service_role;
