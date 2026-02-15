-- Create a function to check service health
-- This allows the frontend to verify the DB is reachable and the function exists.
-- We use CREATE OR REPLACE to ensure idempotency.
CREATE OR REPLACE FUNCTION get_service_health()
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'status', 'active',
    'version', 'v1',
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to all roles
GRANT EXECUTE ON FUNCTION get_service_health() TO anon, authenticated, service_role;

-- Reload the schema cache to ensure the new function is immediately available
NOTIFY pgrst, 'reload schema';
