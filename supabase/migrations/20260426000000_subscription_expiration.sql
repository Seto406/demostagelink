-- Function to expire subscriptions
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'inactive',
      tier = 'free'
  WHERE status = 'active'
    AND current_period_end < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job via pg_cron
-- We wrap in a DO block to avoid error if pg_cron is not enabled or if job already exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unscheduling if exists to update schedule or command
    PERFORM cron.unschedule('expire-subscriptions');

    PERFORM cron.schedule(
      'expire-subscriptions',
      '0 * * * *', -- Every hour
      $$SELECT public.expire_subscriptions()$$
    );
  END IF;
END $$;
