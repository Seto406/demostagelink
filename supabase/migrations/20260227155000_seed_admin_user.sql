-- Migration to seed the admin user
-- This ensures there is at least one admin account and attempts to upgrade the client's account if it exists.

DO $$
DECLARE
    v_admin_email TEXT := 'connect.stagelink@gmail.com';
    v_admin_id UUID;
    v_profile_id UUID;
BEGIN
    -- 1. Ensure a fallback admin user exists (connect.stagelink@gmail.com)
    -- Check if user exists in auth.users
    SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;

    IF v_admin_id IS NULL THEN
        -- Generate a new UUID
        v_admin_id := gen_random_uuid();

        -- Insert into auth.users with provided hash
        -- Password: stagelink_adminpass5
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            aud,
            role
        ) VALUES (
            v_admin_id,
            v_admin_email,
            '$2b$10$uoNbOpJEJWuM/L/ZKnSeouwspbL6vnaYhLhlYnQPOd.kfBZBfJPpm', -- stagelink_adminpass5
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"role":"admin"}',
            now(),
            now(),
            'authenticated',
            'authenticated'
        );
    END IF;

    -- Ensure profile exists and is admin
    -- We can't use INSERT ... ON CONFLICT DO UPDATE cleanly if the profile already exists but we want to force role update
    -- So we'll try to update first, then insert if no rows affected (standard UPSERT logic in SQL blocks)

    UPDATE public.profiles
    SET role = 'admin', group_name = 'System Admin'
    WHERE user_id = v_admin_id;

    IF NOT FOUND THEN
        INSERT INTO public.profiles (user_id, role, group_name)
        VALUES (v_admin_id, 'admin', 'System Admin');
    END IF;

    RAISE NOTICE 'Ensured admin user % exists and has admin role.', v_admin_email;

END $$;
