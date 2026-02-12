-- Migration: Audit Compliance Fixes
-- Description: Adds 'tier' to profiles, syncs it from subscriptions, and ensures collaboration_logs RLS.

-- 1. Add 'tier' column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'tier') THEN
        ALTER TABLE public.profiles ADD COLUMN tier text CHECK (tier IN ('free', 'pro')) DEFAULT 'free';
    END IF;
END $$;

-- 2. Create function to sync subscriptions.tier -> profiles.tier
CREATE OR REPLACE FUNCTION public.sync_subscription_tier_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's profile with the new tier
  UPDATE public.profiles
  SET tier = NEW.tier,
      updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on subscriptions
DROP TRIGGER IF EXISTS on_subscription_tier_change ON public.subscriptions;
CREATE TRIGGER on_subscription_tier_change
AFTER INSERT OR UPDATE OF tier ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_subscription_tier_to_profile();

-- 4. Explicit RLS Policy for Service Role on collaboration_logs
-- Grant full access to service_role explicitly.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'collaboration_logs'
        AND policyname = 'Service Role Full Access'
    ) THEN
        CREATE POLICY "Service Role Full Access"
        ON public.collaboration_logs
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 5. Reload Schema Cache to be safe
-- 5. Ensure Index for Fast Filtering exists
-- Checking for idx_profiles_university
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'profiles'
        AND indexname = 'idx_profiles_university'
    ) THEN
        CREATE INDEX idx_profiles_university ON public.profiles(university);
    END IF;
END $$;

-- 6. Reload Schema Cache to be safe
NOTIFY pgrst, 'reload config';
