-- Migration: Create trigger to notify audience when a show is approved
-- Uses pg_net to call the 'notify-new-show' Edge Function

-- DEPENDENCY: Requires 'public.get_user_emails' RPC (defined in 20260228140000_optimize_show_reminders.sql)
-- ensure pg_net extension is enabled (usually done in earlier migrations)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_notify_new_show()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- SECURITY WARNING: DO NOT COMMIT REAL SECRETS TO GIT
  -- Ideally, use a secure vault or environment variable if supported by your setup.
  -- For this migration to work, you MUST replace these placeholders with your actual project URL and Service Role Key.
  project_url TEXT := 'YOUR_PROJECT_URL';
  service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY';
  request_id BIGINT;
BEGIN
  -- Validate configuration
  IF project_url = 'YOUR_PROJECT_URL' OR service_role_key = 'YOUR_SERVICE_ROLE_KEY' THEN
    RAISE WARNING 'Trigger trigger_notify_new_show is not configured. Please set project_url and service_role_key.';
    RETURN NEW;
  END IF;

  -- Construct the payload matches standard Supabase webhook format
  -- Call the Edge Function via pg_net
  -- Note: We use net.http_post to make an asynchronous request

  SELECT net.http_post(
    url := project_url || '/functions/v1/notify-new-show',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    )
  ) INTO request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to trigger notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS on_show_approved ON public.shows;

CREATE TRIGGER on_show_approved
AFTER UPDATE ON public.shows
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved')
EXECUTE FUNCTION public.trigger_notify_new_show();

-- Comments
COMMENT ON FUNCTION public.trigger_notify_new_show IS 'Trigger function to call notify-new-show Edge Function via pg_net. REQUIRES CONFIGURATION of URL and KEY.';
COMMENT ON TRIGGER on_show_approved ON public.shows IS 'Trigger to notify audience when a show is approved';
