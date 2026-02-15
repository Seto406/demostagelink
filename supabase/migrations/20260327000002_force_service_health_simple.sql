-- 1. Create the function (Ensure it matches the name EXACTLY)
CREATE OR REPLACE FUNCTION public.get_service_health()
RETURNS json AS $$
BEGIN
  RETURN json_build_object('status', 'ok', 'timestamp', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant access to everyone (Crucial for the 'System Updating' screen)
GRANT EXECUTE ON FUNCTION public.get_service_health() TO anon, authenticated;

-- 3. FORCE the API to see the new function
NOTIFY pgrst, 'reload schema';
