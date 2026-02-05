-- Create a dummy user for the convention demo
DO $$
DECLARE
    v_user_id UUID := '00000000-0000-0000-0000-000000000000';
    v_profile_id UUID;
BEGIN
    -- Insert into auth.users if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
        VALUES (
            v_user_id,
            'demo@stagelink.show',
            '$2a$10$wT.v7r.F/y/q.u/a/a/a/a/a/a/a/a/a/a/a/a/a/a/a/a/a/a', -- dummy hash
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"role":"producer"}',
            now(),
            now(),
            'authenticated',
            'authenticated'
        );
    END IF;

    -- The trigger handle_new_user should have created the profile by now if we just inserted the user.
    -- However, in a DO block, triggers might fire after the transaction or immediatley.
    -- We'll try to select the profile. If it's not there (because trigger hasn't fired yet or whatever), we wait or insert manually.
    -- Since we can't wait in SQL easily, we will do an UPSERT on profiles if we can, or just UPDATE if it exists.
    -- But since user_id is unique, we can check.

    -- Ensure profile exists (manual insert if trigger failed or hasn't run)
    INSERT INTO public.profiles (user_id, role)
    VALUES (v_user_id, 'producer')
    ON CONFLICT (user_id) DO NOTHING;

    -- Get profile id
    SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = v_user_id;

    -- Update profile details to look real
    UPDATE public.profiles
    SET
        role = 'producer',
        group_name = 'Convention Demo Group',
        description = 'Bringing the best local theater to the convention floor!',
        founded_year = 2024,
        niche = 'local',
        city = 'Convention City',
        avatar_url = 'https://ui-avatars.com/api/?name=Convention+Demo&background=0D8ABC&color=fff'
    WHERE id = v_profile_id;

    -- Insert dummy shows
    -- First clean up any existing demo shows for this producer to prevent duplicates on re-runs
    DELETE FROM public.shows WHERE producer_id = v_profile_id AND title IN (
        'The Quantum Paradox',
        'Midnight at the Oasis',
        'The Last Starship'
    );

    INSERT INTO public.shows (producer_id, title, description, date, venue, ticket_link, poster_url, niche, city, status, price)
    VALUES
    (
        v_profile_id,
        'The Quantum Paradox',
        'A mind-bending journey through time and space where a physicist discovers the secret to the universe.',
        CURRENT_DATE,
        'Main Hall, Convention Center',
        'https://example.com/tickets',
        'https://images.unsplash.com/photo-1503095392237-fc73e83b4a20?auto=format&fit=crop&w=600&q=80',
        'local',
        'Convention City',
        'approved',
        15
    ),
    (
        v_profile_id,
        'Midnight at the Oasis',
        'A vibrant musical spectacular set in a mystical desert oasis, featuring dazzling costumes and choreography.',
        CURRENT_DATE,
        'Grand Stage, Convention Center',
        'https://example.com/tickets',
        'https://images.unsplash.com/photo-1514306191717-452ec28c7f42?auto=format&fit=crop&w=600&q=80',
        'local',
        'Convention City',
        'approved',
        25
    ),
    (
        v_profile_id,
        'The Last Starship',
        'A gripping sci-fi drama about the crew of the last ship escaping a dying earth.',
        CURRENT_DATE + 1,
        'Room 204, Convention Center',
        'https://example.com/tickets',
        'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=600&q=80',
        'local',
        'Convention City',
        'approved',
        12
    );

END $$;
