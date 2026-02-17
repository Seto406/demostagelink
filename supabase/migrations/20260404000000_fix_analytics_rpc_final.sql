CREATE OR REPLACE FUNCTION public.get_analytics_summary(group_id UUID DEFAULT NULL, target_group_id UUID DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  effective_id UUID;
BEGIN
  -- Resolve the group ID from either parameter
  effective_id := COALESCE(target_group_id, group_id);

  -- Mock implementation: Returns 0s for now as requested for the fix.
  -- This matches the mock logic but returns JSON instead of TABLE
  -- to safely match the frontend interface.

  SELECT json_build_object(
      'views', 0,
      'clicks', 0,
      'ctr', 0,
      'chartData', '[]'::json
  ) INTO result;

  RETURN result;
END;
$$;
