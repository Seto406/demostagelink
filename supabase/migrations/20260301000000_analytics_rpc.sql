-- Create RPC function to get analytics summary for a group
-- This aggregates views, clicks, and daily clicks for the last 7 days on the server side
-- to avoid fetching thousands of rows to the client.

CREATE OR REPLACE FUNCTION public.get_analytics_summary(group_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Determine the date range (last 7 days including today) based on UTC
  WITH date_range AS (
      SELECT generate_series(
          (now() AT TIME ZONE 'UTC')::date - INTERVAL '6 days',
          (now() AT TIME ZONE 'UTC')::date,
          '1 day'::interval
      )::date AS date
  ),
  -- Filter events for the group once
  filtered_events AS (
      SELECT event_type, created_at
      FROM analytics_events
      WHERE analytics_events.group_id = get_analytics_summary.group_id
  ),
  -- Aggregate daily clicks for the chart
  daily_clicks AS (
      SELECT
          created_at::date AS date,
          COUNT(*) AS clicks
      FROM filtered_events
      WHERE event_type = 'ticket_click'
        AND created_at >= (now() AT TIME ZONE 'UTC')::date - INTERVAL '6 days'
      GROUP BY created_at::date
  ),
  -- Aggregate overall stats
  stats AS (
      SELECT
          COUNT(*) FILTER (WHERE event_type = 'profile_view') AS views,
          COUNT(*) FILTER (WHERE event_type = 'ticket_click') AS clicks
      FROM filtered_events
  )
  SELECT
      json_build_object(
          'views', COALESCE((SELECT views FROM stats), 0),
          'clicks', COALESCE((SELECT clicks FROM stats), 0),
          'ctr', CASE
              WHEN (SELECT views FROM stats) > 0 THEN
                  ((SELECT clicks FROM stats)::numeric / (SELECT views FROM stats)::numeric) * 100
              ELSE 0
          END,
          'chartData', (
              SELECT json_agg(
                  json_build_object(
                      'date', to_char(dr.date, 'YYYY-MM-DD'),
                      'clicks', COALESCE(dc.clicks, 0)
                  ) ORDER BY dr.date
              )
              FROM date_range dr
              LEFT JOIN daily_clicks dc ON dr.date = dc.date
          )
      ) INTO result;

  RETURN result;
END;
$$;
