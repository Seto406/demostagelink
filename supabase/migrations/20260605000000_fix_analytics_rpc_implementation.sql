-- Re-implement get_analytics_summary to use real data from analytics_events
-- This replaces the mock implementation with actual aggregation logic
-- It uses generate_series to ensure a full 7-day chart is returned even with sparse data

CREATE OR REPLACE FUNCTION public.get_analytics_summary(group_id UUID DEFAULT NULL, target_group_id UUID DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  effective_id UUID;
  total_views BIGINT;
  total_clicks BIGINT;
  ctr NUMERIC;
  chart_data JSON;
BEGIN
  -- Resolve the group ID from either parameter
  effective_id := COALESCE(target_group_id, group_id);

  -- If no ID is provided, return empty structure
  IF effective_id IS NULL THEN
    RETURN json_build_object(
      'views', 0,
      'clicks', 0,
      'ctr', 0,
      'chartData', '[]'::json
    );
  END IF;

  -- 1. Get total views (all time)
  SELECT COUNT(*) INTO total_views
  FROM analytics_events
  WHERE group_id = effective_id
  AND event_type = 'profile_view';

  -- 2. Get total clicks (all time)
  SELECT COUNT(*) INTO total_clicks
  FROM analytics_events
  WHERE group_id = effective_id
  AND event_type = 'ticket_click';

  -- 3. Calculate CTR
  IF total_views > 0 THEN
    ctr := (total_clicks::NUMERIC / total_views::NUMERIC) * 100;
  ELSE
    ctr := 0;
  END IF;

  -- 4. Generate Chart Data (Last 7 Days)
  -- Uses generate_series to create a complete date range, preventing gaps in the chart
  SELECT json_agg(
    json_build_object(
      'date', day_series.day,
      'clicks', COALESCE(daily_counts.clicks, 0),
      'views', COALESCE(daily_counts.views, 0)
    ) ORDER BY day_series.day
  ) INTO chart_data
  FROM (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '6 days',
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE AS day
  ) AS day_series
  LEFT JOIN (
    SELECT
      created_at::DATE AS day,
      COUNT(*) FILTER (WHERE event_type = 'ticket_click') as clicks,
      COUNT(*) FILTER (WHERE event_type = 'profile_view') as views
    FROM analytics_events
    WHERE group_id = effective_id
    AND created_at >= (CURRENT_DATE - INTERVAL '6 days')
    GROUP BY created_at::DATE
  ) AS daily_counts ON day_series.day = daily_counts.day;

  -- 5. Return JSON object matching the frontend interface
  RETURN json_build_object(
    'views', total_views,
    'clicks', total_clicks,
    'ctr', ROUND(ctr, 1),
    'chartData', COALESCE(chart_data, '[]'::json)
  );
END;
$$;
