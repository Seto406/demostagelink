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
    user_id UUID NOT NULL REFERENCES auth.users(id), -- Note: usually requests come from user trying to be producer
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
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
        AND table_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- 4. RLS POLICIES

-- Enable RLS on all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
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

-- Shows: Approved public, Producer full access
DROP POLICY IF EXISTS "Anyone can view approved shows" ON public.shows;
CREATE POLICY "Anyone can view approved shows" ON public.shows FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Producers can view own shows" ON public.shows;
CREATE POLICY "Producers can view own shows" ON public.shows FOR SELECT USING (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Producers can insert shows" ON public.shows;
CREATE POLICY "Producers can insert shows" ON public.shows FOR INSERT WITH CHECK (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Producers can update own shows" ON public.shows;
CREATE POLICY "Producers can update own shows" ON public.shows FOR UPDATE USING (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Tickets (Private)
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
CREATE POLICY "Users can insert own tickets" ON public.tickets FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Payments (Private)
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

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

-- 5. INDEXES (Examples)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_shows_producer_id ON public.shows(producer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_show_id ON public.tickets(show_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
