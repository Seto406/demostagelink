CREATE OR REPLACE FUNCTION public.get_service_health()
RETURNS json AS $$
BEGIN
  RETURN json_build_object('status', 'ok', 'timestamp', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_service_health() TO anon, authenticated;
