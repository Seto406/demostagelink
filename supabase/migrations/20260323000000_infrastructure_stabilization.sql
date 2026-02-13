-- Create a function to reload the schema cache
-- This function sends a notification to PostgREST to reload its schema cache.
CREATE OR REPLACE FUNCTION reload_schema_cache()
RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check service health
-- This allows the frontend to verify the DB is reachable and the function exists.
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_service_health() TO anon, authenticated, service_role;

-- Ensure the schema is reloaded immediately upon applying this migration
NOTIFY pgrst, 'reload schema';
