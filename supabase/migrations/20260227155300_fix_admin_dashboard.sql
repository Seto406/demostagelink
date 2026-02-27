-- Migration: Fix Admin Dashboard Issues

-- 1. Fix producer_requests FK to allow joining with profiles
-- We want producer_requests.user_id to refer to profiles.user_id so PostgREST can expand 'profiles'
DO $$
BEGIN
    -- Try to drop the existing FK to auth.users if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'producer_requests_user_id_fkey') THEN
        ALTER TABLE public.producer_requests DROP CONSTRAINT producer_requests_user_id_fkey;
    END IF;

    -- Add the new FK to profiles(user_id)
    -- This assumes profiles.user_id is UNIQUE, which it is in full_schema.sql
    ALTER TABLE public.producer_requests
    ADD CONSTRAINT producer_requests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error changing FK: %', SQLERRM;
END $$;


-- 2. Ensure Admin RLS Policies are present and correct

-- SHOWS
DROP POLICY IF EXISTS "Admins can view all shows" ON public.shows;
CREATE POLICY "Admins can view all shows" ON public.shows
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all shows" ON public.shows;
CREATE POLICY "Admins can update all shows" ON public.shows
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete all shows" ON public.shows;
CREATE POLICY "Admins can delete all shows" ON public.shows
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

-- PRODUCER REQUESTS
DROP POLICY IF EXISTS "Admins can view all producer requests" ON public.producer_requests;
CREATE POLICY "Admins can view all producer requests" ON public.producer_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all producer requests" ON public.producer_requests;
CREATE POLICY "Admins can update all producer requests" ON public.producer_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

-- PAYMENTS
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;
CREATE POLICY "Admins can update all payments" ON public.payments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

-- PROFILES (Admin needs to see/edit all profiles)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
-- "Public profiles are viewable by everyone" usually covers SELECT, but let's be safe
-- Actually, the existing policy is "Public profiles are viewable by everyone." using (true).
-- So admins can already SELECT.
-- But Admins need to UPDATE (promote/demote users).
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);


-- 3. Ensure get_admin_user_list RPC exists
DROP FUNCTION IF EXISTS public.get_admin_user_list(integer, integer);

CREATE OR REPLACE FUNCTION public.get_admin_user_list(
    page_number integer,
    page_size integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_count integer;
    users_list json;
BEGIN
    -- Check if admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get total count
    SELECT count(*) INTO total_count FROM public.profiles;

    -- Get paginated users with email from auth.users
    SELECT json_agg(t) INTO users_list
    FROM (
        SELECT
            p.id,
            p.user_id,
            u.email,
            p.role,
            p.group_name,
            p.created_at
        FROM public.profiles p
        LEFT JOIN auth.users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT page_size
        OFFSET (page_number - 1) * page_size
    ) t;

    -- If users_list is null (no users), make it empty array
    IF users_list IS NULL THEN
        users_list := '[]'::json;
    END IF;

    RETURN json_build_object(
        'users', users_list,
        'total_count', total_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_user_list(integer, integer) TO authenticated;
