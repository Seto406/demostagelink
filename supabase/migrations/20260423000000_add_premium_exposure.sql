-- Add is_premium to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Add is_premium to shows
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Add is_premium to theater_groups (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'theater_groups') THEN
        ALTER TABLE public.theater_groups ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Function to sync premium status
CREATE OR REPLACE FUNCTION public.sync_premium_status()
RETURNS TRIGGER AS $$
DECLARE
    is_pro BOOLEAN;
BEGIN
    -- Determine if user is pro (check status AND tier)
    is_pro := (NEW.status = 'active' AND NEW.tier = 'pro');

    -- Update profiles (using user_id to match subscription user_id)
    UPDATE public.profiles
    SET is_premium = is_pro
    WHERE user_id = NEW.user_id;

    -- Update shows
    -- Assumes shows.producer_id references profiles.id (standard Supabase pattern)
    UPDATE public.shows
    SET is_premium = is_pro
    WHERE producer_id IN (
        SELECT id FROM public.profiles WHERE user_id = NEW.user_id
    );

    -- Update theater_groups (if exists, using dynamic SQL to avoid compilation errors if table missing)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'theater_groups') THEN
         EXECUTE format('UPDATE public.theater_groups SET is_premium = $1 WHERE owner_id = $2')
         USING is_pro, NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS on_subscription_change ON public.subscriptions;
CREATE TRIGGER on_subscription_change
AFTER INSERT OR UPDATE OF status, tier ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_premium_status();
