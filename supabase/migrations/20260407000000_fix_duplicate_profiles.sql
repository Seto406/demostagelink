-- Migration: Fix duplicate profiles and user data for sethalvarez2001@gmail.com

-- 1. Ensure is_onboarded column exists (requested by user)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_onboarded') THEN
        ALTER TABLE public.profiles ADD COLUMN is_onboarded BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Handle Duplicate Auth Users & User Stats
DO $$
DECLARE
    canonical_user_id UUID := '1a48c65d-c324-481a-a08b-7365edc1cfb5';
    duplicate_user_id UUID;
    duplicate_xp INTEGER;
BEGIN
    -- Find duplicate user ID (if any)
    -- We use a precise lookup. Note: Accessing auth.users requires appropriate permissions.
    -- If this runs in a standard migration, it should have access.
    SELECT id INTO duplicate_user_id
    FROM auth.users
    WHERE email = 'sethalvarez2001@gmail.com' AND id != canonical_user_id
    LIMIT 1;

    IF duplicate_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found duplicate user: %', duplicate_user_id;

        -- Check for stats on duplicate user
        -- We check if the table exists first to avoid errors if it was dropped/renamed
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stats') THEN
            SELECT xp INTO duplicate_xp FROM public.user_stats WHERE user_id = duplicate_user_id;

            IF duplicate_xp IS NOT NULL AND duplicate_xp > 0 THEN
                -- Merge stats into canonical user
                -- If canonical user has stats, add XP. If not, insert.
                INSERT INTO public.user_stats (user_id, xp)
                VALUES (canonical_user_id, duplicate_xp)
                ON CONFLICT (user_id) DO UPDATE
                SET xp = public.user_stats.xp + EXCLUDED.xp;

                RAISE NOTICE 'Merged % XP from duplicate user to canonical user.', duplicate_xp;
            END IF;
        END IF;

        -- Delete duplicate user (cascades to profiles, user_stats, etc.)
        DELETE FROM auth.users WHERE id = duplicate_user_id;
        RAISE NOTICE 'Deleted duplicate auth user: %', duplicate_user_id;
    END IF;

    -- 3. Delete Ghost Profile (if it still exists after user deletion, or if it was unlinked)
    DELETE FROM public.profiles WHERE id = '60ea48a0-38cf-433a-80fd-ba3c602b26d6';

    -- 4. Restore/Update Canonical Profile
    -- Use user_id match as fallback if id doesn't match (profiles.id is usually random UUID)
    UPDATE public.profiles
    SET
        role = 'producer',
        group_name = 'MUGNA PRODUCTIONS',
        is_onboarded = true
    WHERE id = canonical_user_id OR user_id = canonical_user_id;

END $$;
