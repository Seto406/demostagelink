-- Create RPC function to get show counts by city
-- This aggregates data on the server side to improve performance
-- and reduce data transfer.

CREATE OR REPLACE FUNCTION public.get_city_show_counts()
RETURNS TABLE (city text, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT city, COUNT(*) as count
  FROM public.shows
  WHERE status = 'approved' AND deleted_at IS NULL
  GROUP BY city
  ORDER BY count DESC;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_city_show_counts() TO anon, authenticated;
