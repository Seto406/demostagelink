-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('audience', 'producer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.show_status AS ENUM ('pending', 'approved', 'rejected', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.niche_type AS ENUM ('local', 'university');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    role public.user_role NOT NULL DEFAULT 'audience',
    group_name TEXT,
    description TEXT,
    founded_year INTEGER,
    niche public.niche_type,
    map_screenshot_url TEXT,
    address TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    website_url TEXT,
    avatar_url TEXT,
    rank TEXT,
    xp INTEGER,
    university TEXT,
    group_logo_url TEXT,
    group_banner_url TEXT,
    producer_role TEXT,
    has_completed_tour BOOLEAN DEFAULT FALSE,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- theater_groups
CREATE TABLE IF NOT EXISTS public.theater_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- shows
CREATE TABLE IF NOT EXISTS public.shows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    date TEXT,
    venue TEXT,
    ticket_link TEXT,
    poster_url TEXT,
    niche public.niche_type DEFAULT 'local',
    city TEXT,
    status public.show_status NOT NULL DEFAULT 'pending',
    cast_members JSONB,
    director TEXT,
    duration TEXT,
    external_links JSONB,
    genre TEXT,
    production_status TEXT,
    seo_metadata JSONB,
    show_time TEXT,
    tags TEXT[],
    video_url TEXT,
    reservation_fee NUMERIC,
    collect_balance_onsite BOOLEAN,
    price NUMERIC DEFAULT 0,
    is_update BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL,
    paymongo_checkout_id TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- tickets
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    show_id UUID NOT NULL REFERENCES public.shows(id),
    status TEXT DEFAULT 'confirmed',
    payment_id UUID REFERENCES public.payments(id),
    access_code TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id), -- References Auth ID via profiles table unique constraint
    status TEXT,
    tier TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- favorites (shows)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    show_id UUID NOT NULL REFERENCES public.shows(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- follows (profiles)
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.profiles(id),
    following_id UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    actor_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- comments (shows)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    show_id UUID NOT NULL REFERENCES public.shows(id),
    content TEXT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- reviews (shows)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    show_id UUID NOT NULL REFERENCES public.shows(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- posts (social feed)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    media_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- post_comments
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- post_likes
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- show_likes
CREATE TABLE IF NOT EXISTS public.show_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id UUID NOT NULL REFERENCES public.shows(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- activities
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    action_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    group_id UUID REFERENCES public.profiles(id),
    show_id UUID REFERENCES public.shows(id),
    user_id UUID REFERENCES auth.users(id),
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- badges
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- user_badges
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    badge_id UUID NOT NULL REFERENCES public.badges(id),
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- collaboration_requests
CREATE TABLE IF NOT EXISTS public.collaboration_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    receiver_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- producer_requests
CREATE TABLE IF NOT EXISTS public.producer_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id), -- Correctly references profiles(user_id) now
    group_name TEXT NOT NULL,
    portfolio_link TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT,
    status TEXT DEFAULT 'pending',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- group_members
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.profiles(id),
    user_id UUID REFERENCES public.profiles(id), -- Nullable if just invited by email
    member_name TEXT NOT NULL,
    role_in_group TEXT,
    status TEXT DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- group_audience_links
CREATE TABLE IF NOT EXISTS public.group_audience_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.profiles(id),
    audience_user_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- show_edit_requests
CREATE TABLE IF NOT EXISTS public.show_edit_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
    producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    changes JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 3. FUNCTIONS & TRIGGERS

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT c.table_name
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        WHERE c.column_name = 'updated_at'
        AND c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- Function to handle show update status
CREATE OR REPLACE FUNCTION public.handle_show_update_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if it's an update or insert where updated_at is significantly later than created_at
    -- We use a 1-minute buffer to allow for initial creation adjustments
    IF NEW.updated_at > (NEW.created_at + interval '1 minute') THEN
        NEW.is_update := true;
    ELSE
        NEW.is_update := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for shows to set is_update
DROP TRIGGER IF EXISTS z_check_is_update ON public.shows;
CREATE TRIGGER z_check_is_update
BEFORE INSERT OR UPDATE ON public.shows
FOR EACH ROW
EXECUTE FUNCTION public.handle_show_update_status();

-- Admin Dashboard Stats RPC
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users integer;
  total_shows integer;
  active_producers integer;
  pending_requests integer;
  deleted_shows integer;
  pending_new_shows integer;
  pending_edited_shows integer;
  approved_shows integer;
  rejected_shows integer;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Execute counts
  SELECT count(*) INTO total_users FROM profiles;
  SELECT count(*) INTO total_shows FROM shows WHERE deleted_at IS NULL;
  SELECT count(*) INTO active_producers FROM profiles WHERE role = 'producer';
  SELECT count(*) INTO pending_requests FROM producer_requests WHERE status = 'pending';
  SELECT count(*) INTO deleted_shows FROM shows WHERE deleted_at IS NOT NULL;

  -- Split pending shows into new and edited
  SELECT count(*) INTO pending_new_shows FROM shows WHERE status = 'pending' AND deleted_at IS NULL AND is_update = false;
  SELECT count(*) INTO pending_edited_shows FROM shows WHERE status = 'pending' AND deleted_at IS NULL AND is_update = true;

  SELECT count(*) INTO approved_shows FROM shows WHERE status = 'approved' AND deleted_at IS NULL;
  SELECT count(*) INTO rejected_shows FROM shows WHERE status = 'rejected' AND deleted_at IS NULL;

  RETURN json_build_object(
    'totalUsers', total_users,
    'totalShows', total_shows,
    'activeProducers', active_producers,
    'pendingRequests', pending_requests,
    'deletedShows', deleted_shows,
    'pendingNewShows', pending_new_shows,
    'pendingEditedShows', pending_edited_shows,
    'approvedShows', approved_shows,
    'rejectedShows', rejected_shows
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

-- Admin User List RPC
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

-- Approve Edit Request RPC
CREATE OR REPLACE FUNCTION public.approve_show_edit_request(request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    req RECORD;
    target_show_id UUID;
    show_changes JSONB;
BEGIN
    -- Check if admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get the request
    SELECT * INTO req FROM public.show_edit_requests WHERE id = request_id AND status = 'pending';

    IF req IS NULL THEN
        RAISE EXCEPTION 'Request not found or not pending';
    END IF;

    target_show_id := req.show_id;
    show_changes := req.changes;

    -- Update the show with the changes
    -- We check if the key EXISTS in the JSON using the ? operator.
    -- If it exists, we take the value (even if it is null).
    -- If it doesn't exist, we keep the original column value.
    -- Casting is crucial.

    UPDATE public.shows
    SET
        title = CASE WHEN show_changes ? 'title' THEN (show_changes->>'title') ELSE title END,
        description = CASE WHEN show_changes ? 'description' THEN (show_changes->>'description') ELSE description END,
        date = CASE WHEN show_changes ? 'date' THEN (show_changes->>'date') ELSE date END,
        show_time = CASE WHEN show_changes ? 'show_time' THEN (show_changes->>'show_time') ELSE show_time END,
        venue = CASE WHEN show_changes ? 'venue' THEN (show_changes->>'venue') ELSE venue END,
        city = CASE WHEN show_changes ? 'city' THEN (show_changes->>'city') ELSE city END,
        niche = CASE WHEN show_changes ? 'niche' THEN (show_changes->>'niche')::public.niche_type ELSE niche END,
        ticket_link = CASE WHEN show_changes ? 'ticket_link' THEN (show_changes->>'ticket_link') ELSE ticket_link END,
        external_links = CASE WHEN show_changes ? 'external_links' THEN (show_changes->'external_links') ELSE external_links END,
        price = CASE WHEN show_changes ? 'price' THEN (show_changes->>'price')::numeric ELSE price END,
        poster_url = CASE WHEN show_changes ? 'poster_url' THEN (show_changes->>'poster_url') ELSE poster_url END,
        reservation_fee = CASE WHEN show_changes ? 'reservation_fee' THEN (show_changes->>'reservation_fee')::numeric ELSE reservation_fee END,
        collect_balance_onsite = CASE WHEN show_changes ? 'collect_balance_onsite' THEN (show_changes->>'collect_balance_onsite')::boolean ELSE collect_balance_onsite END,
        genre = CASE WHEN show_changes ? 'genre' THEN (show_changes->>'genre') ELSE genre END,
        director = CASE WHEN show_changes ? 'director' THEN (show_changes->>'director') ELSE director END,
        duration = CASE WHEN show_changes ? 'duration' THEN (show_changes->>'duration') ELSE duration END,
        tags = CASE
            WHEN show_changes ? 'tags' THEN
                (SELECT array_agg(x) FROM jsonb_array_elements_text(show_changes->'tags') t(x))
            ELSE tags
        END,
        cast_members = CASE WHEN show_changes ? 'cast_members' THEN (show_changes->'cast_members') ELSE cast_members END,
        seo_metadata = CASE WHEN show_changes ? 'seo_metadata' THEN (show_changes->'seo_metadata') ELSE seo_metadata END,
        production_status = CASE WHEN show_changes ? 'production_status' THEN (show_changes->>'production_status') ELSE production_status END,
        updated_at = now()
    WHERE id = target_show_id;

    -- Mark request as approved
    UPDATE public.show_edit_requests
    SET status = 'approved', updated_at = now()
    WHERE id = request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_show_edit_request(UUID) TO authenticated;

-- Reject Edit Request RPC
CREATE OR REPLACE FUNCTION public.reject_show_edit_request(request_id UUID, feedback TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Update request status
    UPDATE public.show_edit_requests
    SET status = 'rejected', admin_feedback = feedback, updated_at = now()
    WHERE id = request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_show_edit_request(UUID, TEXT) TO authenticated;

-- 4. RLS POLICIES

-- Enable RLS on all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- Profiles: Public read, User write own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Admins can update all profiles
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

-- Shows: Approved public, Producer full access
DROP POLICY IF EXISTS "Anyone can view approved shows" ON public.shows;
CREATE POLICY "Anyone can view approved shows" ON public.shows FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Producers can view own shows" ON public.shows;
CREATE POLICY "Producers can view own shows" ON public.shows FOR SELECT USING (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Producers can insert shows" ON public.shows;
CREATE POLICY "Producers can insert shows" ON public.shows FOR INSERT WITH CHECK (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Producers can update own shows" ON public.shows;
CREATE POLICY "Producers can update own shows" ON public.shows FOR UPDATE USING (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

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

-- Tickets (Private)
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
CREATE POLICY "Users can insert own tickets" ON public.tickets FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Payments (Private)
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

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

DROP POLICY IF EXISTS "Admins can delete all payments" ON public.payments;
CREATE POLICY "Admins can delete all payments" ON public.payments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Subscriptions (Private)
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Favorites (Private)
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Follows (Public Read)
DROP POLICY IF EXISTS "Public can view follows" ON public.follows;
CREATE POLICY "Public can view follows" ON public.follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can follow" ON public.follows;
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (follower_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (follower_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Notifications (Private)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications; -- Mark as read
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Comments (Public Read, Author Write)
DROP POLICY IF EXISTS "Public can view comments" ON public.comments;
CREATE POLICY "Public can view comments" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;
CREATE POLICY "Users can insert comments" ON public.comments FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR UPDATE USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Producers can moderate show comments" ON public.comments;
CREATE POLICY "Producers can moderate show comments" ON public.comments FOR UPDATE USING (show_id IN (SELECT id FROM public.shows WHERE producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "Admins can moderate comments" ON public.comments;
CREATE POLICY "Admins can moderate comments" ON public.comments FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin'));

-- Reviews (Public Read, Author Write)
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert reviews" ON public.reviews;
CREATE POLICY "Users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Posts (Public Read, Author Write)
DROP POLICY IF EXISTS "Public can view posts" ON public.posts;
CREATE POLICY "Public can view posts" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert posts" ON public.posts;
CREATE POLICY "Users can insert posts" ON public.posts FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Post Comments (Public Read, Author Write)
DROP POLICY IF EXISTS "Public can view post comments" ON public.post_comments;
CREATE POLICY "Public can view post comments" ON public.post_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert post comments" ON public.post_comments;
CREATE POLICY "Users can insert post comments" ON public.post_comments FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own post comments" ON public.post_comments;
CREATE POLICY "Users can delete own post comments" ON public.post_comments FOR UPDATE USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Post authors can moderate post comments" ON public.post_comments;
CREATE POLICY "Post authors can moderate post comments" ON public.post_comments FOR UPDATE USING (post_id IN (SELECT id FROM public.posts WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "Admins can moderate post comments" ON public.post_comments;
CREATE POLICY "Admins can moderate post comments" ON public.post_comments FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin'));

-- Post Likes (Public Read, Author Write)
DROP POLICY IF EXISTS "Public can view post likes" ON public.post_likes;
CREATE POLICY "Public can view post likes" ON public.post_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can toggle post likes" ON public.post_likes;
CREATE POLICY "Users can toggle post likes" ON public.post_likes FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Show Likes (Public Read, Author Write)
DROP POLICY IF EXISTS "Public can view show likes" ON public.show_likes;
CREATE POLICY "Public can view show likes" ON public.show_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can toggle show likes" ON public.show_likes;
CREATE POLICY "Users can toggle show likes" ON public.show_likes FOR ALL USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Activities (Public Read)
DROP POLICY IF EXISTS "Public can view activities" ON public.activities;
CREATE POLICY "Public can view activities" ON public.activities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert activities" ON public.activities;
CREATE POLICY "Users can insert activities" ON public.activities FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Analytics Events (Private/Producer/Admin)
DROP POLICY IF EXISTS "Producers can view their own analytics" ON public.analytics_events;
CREATE POLICY "Producers can view their own analytics" ON public.analytics_events FOR SELECT USING (group_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events FOR INSERT WITH CHECK (true);

-- Badges (Public Read)
DROP POLICY IF EXISTS "Public can view badges" ON public.badges;
CREATE POLICY "Public can view badges" ON public.badges FOR SELECT USING (true);

-- User Badges (Public Read)
DROP POLICY IF EXISTS "Public can view user badges" ON public.user_badges;
CREATE POLICY "Public can view user badges" ON public.user_badges FOR SELECT USING (true);

-- Collaboration Requests (Private: Sender/Receiver)
DROP POLICY IF EXISTS "Users can view their collab requests" ON public.collaboration_requests;
CREATE POLICY "Users can view their collab requests" ON public.collaboration_requests FOR SELECT USING (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    receiver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can insert collab requests" ON public.collaboration_requests;
CREATE POLICY "Users can insert collab requests" ON public.collaboration_requests FOR INSERT WITH CHECK (sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update collab requests" ON public.collaboration_requests;
CREATE POLICY "Users can update collab requests" ON public.collaboration_requests FOR UPDATE USING (receiver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Producer Requests (Private: User/Admin)
DROP POLICY IF EXISTS "Users can view own producer requests" ON public.producer_requests;
CREATE POLICY "Users can view own producer requests" ON public.producer_requests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert producer requests" ON public.producer_requests;
CREATE POLICY "Users can insert producer requests" ON public.producer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

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

DROP POLICY IF EXISTS "Admins can delete all producer requests" ON public.producer_requests;
CREATE POLICY "Admins can delete all producer requests" ON public.producer_requests
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Invitations (Public Read by ID)
DROP POLICY IF EXISTS "Anyone can view invitations by ID" ON public.invitations;
CREATE POLICY "Anyone can view invitations by ID" ON public.invitations FOR SELECT USING (true);

-- Group Members (Public Read, Owner Write)
DROP POLICY IF EXISTS "Public can view group members" ON public.group_members;
CREATE POLICY "Public can view group members" ON public.group_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Group owners can manage members" ON public.group_members;
CREATE POLICY "Group owners can manage members" ON public.group_members FOR ALL USING (
    group_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Group Audience Links (Private)
DROP POLICY IF EXISTS "Group/Audience can view links" ON public.group_audience_links;
CREATE POLICY "Group/Audience can view links" ON public.group_audience_links FOR SELECT USING (
    group_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    audience_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Theater Groups (Public Read, Owner Write)
DROP POLICY IF EXISTS "Public can view theater groups" ON public.theater_groups;
CREATE POLICY "Public can view theater groups" ON public.theater_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners can update theater groups" ON public.theater_groups;
CREATE POLICY "Owners can update theater groups" ON public.theater_groups FOR UPDATE USING (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- System Settings (Public Read)
DROP POLICY IF EXISTS "Public can view system settings" ON public.system_settings;
CREATE POLICY "Public can view system settings" ON public.system_settings FOR SELECT USING (true);

-- Show Edit Requests RLS
DROP POLICY IF EXISTS "Producers can view own edit requests" ON public.show_edit_requests;
CREATE POLICY "Producers can view own edit requests" ON public.show_edit_requests
    FOR SELECT
    USING (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Producers can insert own edit requests" ON public.show_edit_requests;
CREATE POLICY "Producers can insert own edit requests" ON public.show_edit_requests
    FOR INSERT
    WITH CHECK (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Producers can update own pending edit requests" ON public.show_edit_requests;
CREATE POLICY "Producers can update own pending edit requests" ON public.show_edit_requests
    FOR UPDATE
    USING (
        producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND
        status = 'pending'
    );

DROP POLICY IF EXISTS "Admins can view all edit requests" ON public.show_edit_requests;
CREATE POLICY "Admins can view all edit requests" ON public.show_edit_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update all edit requests" ON public.show_edit_requests;
CREATE POLICY "Admins can update all edit requests" ON public.show_edit_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 5. INDEXES (Examples)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_shows_producer_id ON public.shows(producer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_show_id ON public.tickets(show_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);


-- 6. TICKET ACCESS CODE GENERATION
CREATE OR REPLACE FUNCTION generate_ticket_access_code()
RETURNS TRIGGER AS $$
DECLARE
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  result text := '';
  i integer := 0;
  exists_check boolean;
BEGIN
  IF NEW.access_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || chars[1+floor(random()*array_length(chars, 1))::int];
    END LOOP;

    SELECT EXISTS(SELECT 1 FROM public.tickets WHERE access_code = result) INTO exists_check;
    IF NOT exists_check THEN
      NEW.access_code := result;
      EXIT;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_ticket_access_code ON public.tickets;
CREATE TRIGGER ensure_ticket_access_code
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_access_code();

-- Backfill existing tickets
DO $$
DECLARE
  t_record RECORD;
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  new_code text;
  i integer;
  exists_check boolean;
BEGIN
  FOR t_record IN SELECT id FROM public.tickets WHERE access_code IS NULL LOOP
    LOOP
      new_code := '';
      FOR i IN 1..6 LOOP
        new_code := new_code || chars[1+floor(random()*array_length(chars, 1))::int];
      END LOOP;

      SELECT EXISTS(SELECT 1 FROM public.tickets WHERE access_code = new_code) INTO exists_check;
      IF NOT exists_check THEN
        UPDATE public.tickets SET access_code = new_code WHERE id = t_record.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 7. BATCH USER EMAIL FETCHING (RPC)
-- Purpose: Securely fetch user emails for admin broadcasts and reminders
-- DEPENDENCY: Used by 'broadcast-new-show' and 'send-show-reminder' Edge Functions

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids UUID[])
RETURNS TABLE (user_id UUID, email TEXT)
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- This function is intended to be called by service_role only
  -- It returns emails which are sensitive information

  RETURN QUERY
  SELECT id as user_id, auth.users.email::TEXT
  FROM auth.users
  WHERE id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;

-- Revoke execution from public to prevent unauthorized access
REVOKE EXECUTE ON FUNCTION public.get_user_emails(UUID[]) FROM PUBLIC;

-- Grant execution to service_role (used by Edge Functions)
GRANT EXECUTE ON FUNCTION public.get_user_emails(UUID[]) TO service_role;
