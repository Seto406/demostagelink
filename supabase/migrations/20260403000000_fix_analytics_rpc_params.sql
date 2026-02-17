-- Fix analytics RPC parameter naming inconsistency
-- Drops the old function (which might have been returning TABLE or JSON depending on version)
-- Creates a new function that accepts both target_group_id and group_id (as alias)
-- Returns JSON to ensure compatibility with the frontend's expected data structure

DROP FUNCTION IF EXISTS public.get_analytics_summary(uuid);

CREATE OR REPLACE FUNCTION public.get_analytics_summary(target_group_id UUID DEFAULT NULL, group_id UUID DEFAULT NULL)
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
  -- This matches the mock logic in 20260402000000 but returns JSON instead of TABLE
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
