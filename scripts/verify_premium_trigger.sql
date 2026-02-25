-- Script to verify the premium exposure logic and trigger
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
    test_user_id UUID;
    producer_profile_id UUID;
BEGIN
    -- 1. Find a producer user
    SELECT user_id, id INTO test_user_id, producer_profile_id
    FROM public.profiles
    WHERE role = 'producer'
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No producer found to test.';
        RETURN;
    END IF;

    RAISE NOTICE 'Testing trigger for User ID: % (Profile ID: %)', test_user_id, producer_profile_id;

    -- 2. Simulate Subscription Upgrade (Upsert)
    RAISE NOTICE 'Simulating PRO subscription...';
    INSERT INTO public.subscriptions (user_id, status, tier)
    VALUES (test_user_id, 'active', 'pro')
    ON CONFLICT (user_id) DO UPDATE
    SET status = 'active', tier = 'pro', updated_at = now();

    -- 3. Verify Profile Update
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = producer_profile_id AND is_premium = true) THEN
        RAISE NOTICE '✅ SUCCESS: Profile is_premium set to TRUE';
    ELSE
        RAISE NOTICE '❌ FAILURE: Profile is_premium is FALSE';
    END IF;

    -- 4. Verify Shows Update
    -- Check if they have any shows
    IF NOT EXISTS (SELECT 1 FROM public.shows WHERE producer_id = producer_profile_id) THEN
        RAISE NOTICE '⚠️ WARNING: This producer has no shows to verify.';
    ELSE
        IF EXISTS (SELECT 1 FROM public.shows WHERE producer_id = producer_profile_id AND is_premium = true) THEN
             RAISE NOTICE '✅ SUCCESS: Shows updated to premium';
        ELSE
             RAISE NOTICE '❌ FAILURE: Shows are NOT updated to premium';
        END IF;
    END IF;

    -- 5. Revert Changes (Optional - comment out to keep them premium)
    -- RAISE NOTICE 'Reverting to free tier...';
    -- UPDATE public.subscriptions SET tier = 'free' WHERE user_id = test_user_id;
    -- Check reversion
    -- IF EXISTS (SELECT 1 FROM public.profiles WHERE id = producer_profile_id AND is_premium = false) THEN
    --    RAISE NOTICE '✅ SUCCESS: Reverted correctly';
    -- END IF;

END $$;
