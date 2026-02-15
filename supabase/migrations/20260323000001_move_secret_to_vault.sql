-- Migration: Move hardcoded secret to Supabase Vault
-- This migration enables the Supabase Vault extension and moves the service_role_key
-- from the function body to the vault.

-- 1. Enable Supabase Vault extension
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA vault;

-- 2. Extract the secret from the existing function and store it in the vault
-- This avoids hardcoding the secret in this migration file.
DO $$
DECLARE
    func_source text;
    secret_value text;
BEGIN
    -- Get the function source definition
    -- We cast to regproc to find the function by name.
    -- Note: If the function doesn't exist, this will raise an error, which is expected as we are migrating it.
    -- We assume the previous migration created this function.
    SELECT pg_get_functiondef('public.trigger_notify_new_show'::regproc) INTO func_source;

    -- Extract the secret using regex
    -- Pattern looks for: service_role_key TEXT := '...';
    -- We capture the content inside the single quotes.
    -- The regex handles potential whitespace variations and case sensitivity for 'TEXT'.
    -- The pattern string is constructed to match: service_role_key [whitespace] TEXT [whitespace] := [whitespace] ' [captured group] '
    secret_value := substring(func_source FROM 'service_role_key\s+[Tt][Ee][Xx][Tt]\s*:=\s*''([^'']+)''');

    IF secret_value IS NOT NULL THEN
        -- Check if the secret already exists to prevent errors or overwriting
        IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'service_role_key') THEN
            PERFORM vault.create_secret(secret_value, 'service_role_key', 'Service role key for Edge Function calls (migrated from function)');
            RAISE NOTICE 'Successfully migrated service_role_key to Vault.';
        ELSE
             RAISE NOTICE 'service_role_key already exists in Vault, skipping creation.';
        END IF;
    ELSE
        RAISE WARNING 'Could not extract service_role_key from existing function definition. Please ensure the secret is added manually to vault.secrets with name "service_role_key".';
    END IF;
END $$;

-- 3. Update the trigger function to use the secret from the vault
CREATE OR REPLACE FUNCTION public.trigger_notify_new_show()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  project_url TEXT := 'https://dssbduklgbmxezpjpuen.supabase.co';
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- Fetch the secret from Vault
  -- We use the decrypted_secrets view which returns the decrypted secret
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  -- Validate that we retrieved the key
  IF service_role_key IS NULL THEN
    RAISE EXCEPTION 'Configuration error: service_role_key not found in vault.secrets';
  END IF;

  -- Call the Edge Function via pg_net (now in extensions schema)
  -- Note: The pg_net extension was moved to the 'extensions' schema in migration 20260322000000_security_sweep.sql.
  -- Thus we use extensions.http_post instead of net.http_post.
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
$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.trigger_notify_new_show IS 'Trigger function to call notify-new-show Edge Function via pg_net (extensions schema). Uses Supabase Vault for secrets.';
