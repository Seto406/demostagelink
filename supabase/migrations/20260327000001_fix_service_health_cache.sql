-- Migration to robustly define service health check and reload schema cache
CREATE OR REPLACE FUNCTION public.get_service_health()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'status', 'ok',
    'health', 'active',
    'version', 'v1',
    'timestamp', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_service_health() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
