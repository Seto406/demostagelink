-- Migration to seed the admin user
-- This ensures there is at least one admin account and attempts to upgrade the client's account if it exists.

DO $$
DECLARE
    v_admin_email TEXT := 'admin@stagelink.show';
    v_client_email TEXT := 'janine@stagelink.show'; -- Replace with actual client email if different
    v_admin_id UUID;
    v_client_id UUID;
BEGIN
    -- 1. Ensure a fallback admin user exists (admin@stagelink.show)
    -- Check if user exists in auth.users
    SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;

    IF v_admin_id IS NULL THEN
        -- Generate a new UUID
        v_admin_id := gen_random_uuid();

        -- Insert into auth.users (with a dummy password hash)
        -- Note: In a real scenario, the user would need to reset their password or use a known hash.
        -- Using a dummy hash here.
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
            '$2a$10$wT.v7r.F/y/q.u/a/a/a/a/a/a/a/a/a/a/a/a/a/a/a/a/a/a', -- dummy hash
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
    INSERT INTO public.profiles (user_id, role, group_name)
    VALUES (v_admin_id, 'admin', 'System Admin')
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'admin', group_name = 'System Admin';

    -- 2. Upgrade the client user if they exist (janine@stagelink.show)
    SELECT id INTO v_client_id FROM auth.users WHERE email = v_client_email;

    IF v_client_id IS NOT NULL THEN
        -- Update their profile to be admin
        UPDATE public.profiles
        SET role = 'admin'
        WHERE user_id = v_client_id;

        RAISE NOTICE 'Upgraded client user % to admin.', v_client_email;
    ELSE
        RAISE NOTICE 'Client user % not found. They will need to be manually upgraded or sign up first.', v_client_email;
    END IF;

END $$;
