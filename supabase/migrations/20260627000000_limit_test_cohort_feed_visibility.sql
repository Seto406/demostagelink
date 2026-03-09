-- Limit feed/show visibility for designated test cohort accounts.
-- Test cohort users can only view posts/shows created by the same cohort.

CREATE OR REPLACE FUNCTION public.is_test_cohort_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = ANY (
    ARRAY[
      'dev.producer@test.com',
      'dev.producer2@test.com',
      'dev.audience@test.com'
    ]
  );
$$;

CREATE OR REPLACE FUNCTION public.is_test_cohort_profile(profile_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.id = profile_uuid
      AND lower(u.email) = ANY (
        ARRAY[
          'dev.producer@test.com',
          'dev.producer2@test.com',
          'dev.audience@test.com'
        ]
      )
  );
$$;

DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
CREATE POLICY "Public posts are viewable by everyone"
ON public.posts
FOR SELECT
USING (
  NOT public.is_test_cohort_user()
  OR public.is_test_cohort_profile(profile_id)
);

DROP POLICY IF EXISTS "Anyone can view approved shows" ON public.shows;
CREATE POLICY "Anyone can view approved shows"
ON public.shows
FOR SELECT
USING (
  status = 'approved'
  AND deleted_at IS NULL
  AND (
    NOT public.is_test_cohort_user()
    OR public.is_test_cohort_profile(producer_id)
  )
);
