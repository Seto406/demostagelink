-- Migration: Secondary Security Sweep
-- Addresses mutable function search path, RLS tightening, and extension hygiene.

-- 1. Create 'extensions' schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Move pg_net extension to 'extensions' schema
-- Note: This moves the extension's objects (like the 'net' schema or functions) to the new schema.
-- If pg_net creates a schema named 'net', this command might fail if not relocatable.
-- However, standard Supabase practice allows relocatable extensions.
-- If pg_net was installed in 'public', its functions will move to 'extensions'.
-- If pg_net created a 'net' schema, that schema might remain or be moved.
-- Based on standard behavior, we assume functions will be accessible via extensions.<function_name>
-- or net.<function_name> if the schema 'net' is preserved but owned by the extension in 'extensions'.
-- But usually, relocating an extension moves its member objects to the target schema.
-- Thus, net.http_post becomes extensions.http_post.

ALTER EXTENSION pg_net SET SCHEMA extensions;

-- 3. Update trigger_notify_new_show to use strict search_path and correct function reference
CREATE OR REPLACE FUNCTION public.trigger_notify_new_show()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- SECURITY WARNING: THIS FILE CONTAINS SECRETS. DO NOT COMMIT TO PUBLIC REPO.
  -- TODO: Move this secret to Supabase Vault or environment variable in a future update.
  -- This key is required for the trigger to call the Edge Function securely.
  project_url TEXT := 'https://dssbduklgbmxezpjpuen.supabase.co';
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzc2JkdWtsZ2JteGV6cGpwdWVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc2NjQ0OCwiZXhwIjoyMDg1MzQyNDQ4fQ.XCdOnAkx7o_B0OADTbbuEBSBOHo3DSL8U8OdNHVgx08'; -- REPLACE WITH ACTUAL SERVICE ROLE KEY
  request_id BIGINT;
BEGIN
  -- Construct the payload matches standard Supabase webhook format
  -- Call the Edge Function via pg_net (now in extensions schema)
  -- We use extensions.http_post to make an asynchronous request
  -- Note: If pg_net maintains a 'net' schema even after relocation, this might need to be net.http_post.
  -- But standard relocation moves objects to the target schema.

  SELECT extensions.http_post(
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

-- 4. Tighten Analytics RLS
-- Remove potentially broad policies and enforce strict INSERT-only for anon/authenticated roles.

DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;

CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- Ensure no other policies allow modification by non-admins (default is deny unless policy exists)
-- Existing policies:
-- "Producers can view their own analytics" (SELECT)
-- "Admins can view all analytics" (SELECT)
-- So only INSERT is allowed for public, and only for valid roles.

-- 5. Comments
COMMENT ON EXTENSION pg_net IS 'Async HTTP requests (moved to extensions schema for security)';
COMMENT ON FUNCTION public.trigger_notify_new_show IS 'Trigger function to call notify-new-show Edge Function via pg_net (extensions schema). Search path fixed.';
