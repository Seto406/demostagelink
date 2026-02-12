-- Emergency Schema Fix for Production
-- Run this in the Supabase SQL Editor to restore missing tables and functions.
-- This script consolidates multiple migrations into a single execution block.

-- ============================================================================
-- 1. Create Invitations Table
-- Source: 20260313000000_create_invitations_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    first_name TEXT,
    inviter_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    token UUID DEFAULT gen_random_uuid(),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    accepted_at TIMESTAMP WITH TIME ZONE,
    -- Constraint to prevent duplicate pending invites for the same email
    UNIQUE(email, status)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Only Admins can view/manage all invitations
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;
CREATE POLICY "Admins can manage invitations"
ON public.invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger to update invitation status on user confirmation
CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is confirming their email
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.invitations
    SET status = 'accepted', accepted_at = NEW.email_confirmed_at
    WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users (requires superuser privileges, which migrations have)
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_invitation_acceptance();


-- ============================================================================
-- 2. Create Badges Table (Dependency for User Badges)
-- Source: 20260218000000_social_profile_features.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT
  USING (true);

-- Seed some badges
INSERT INTO public.badges (name, description, slug, icon_url)
VALUES
  ('First Act', 'Created your account and joined the community.', 'first-act', '🎭'),
  ('Critic', 'Wrote your first review.', 'critic', '📝'),
  ('Theater Goer', 'Attended 5 shows.', 'theater-goer', '🎟️'),
  ('Supporter', 'Followed 3 theater groups.', 'supporter', '❤️')
ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- 3. Create User Badges Table
-- Source: 20260218000000_social_profile_features.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User badges are viewable by everyone" ON public.user_badges;
CREATE POLICY "User badges are viewable by everyone"
  ON public.user_badges FOR SELECT
  USING (true);


-- ============================================================================
-- 4. Create Reviews Table
-- Source: 20260216000000_social_features.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = reviews.user_id));


-- ============================================================================
-- 5. Create Activities Table
-- Source: 20260218000000_social_profile_features.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- e.g., 'review', 'favorite', 'join', 'attend'
  entity_type TEXT, -- e.g., 'show', 'group'
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activities are viewable by everyone" ON public.activities;
CREATE POLICY "Activities are viewable by everyone"
  ON public.activities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
CREATE POLICY "Users can insert their own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = activities.user_id));


-- ============================================================================
-- 6. Create Favorites Table
-- Source: 20260225000000_fix_favorites_schema.sql
-- ============================================================================

-- Re-create favorites table to link to profiles instead of auth.users
-- Drop if exists with old schema (optional, but requested)
-- We use IF NOT EXISTS here for safety.

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, show_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Policies

-- Anyone can view favorites (e.g. for counts)
DROP POLICY IF EXISTS "Anyone can view favorites" ON public.favorites;
CREATE POLICY "Anyone can view favorites"
ON public.favorites FOR SELECT
USING (true);

-- Users can insert their own favorites
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
CREATE POLICY "Users can add their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = favorites.user_id
  )
);

-- Users can remove their own favorites
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;
CREATE POLICY "Users can remove their own favorites"
ON public.favorites FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = favorites.user_id
  )
);

-- Add simple index for performance
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_show_id_idx ON public.favorites(show_id);


-- ============================================================================
-- 7. Create Producer Requests Table (Dependency for Admin Stats)
-- Source: 20260306000000_create_producer_requests_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.producer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  portfolio_link TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT producer_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable Row Level Security
ALTER TABLE public.producer_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own requests" ON public.producer_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.producer_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.producer_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.producer_requests;

-- RLS Policies

-- Users can insert their own request
CREATE POLICY "Users can insert own requests"
ON public.producer_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.producer_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.producer_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update all requests
CREATE POLICY "Admins can update all requests"
ON public.producer_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS producer_requests_user_id_idx ON public.producer_requests(user_id);
CREATE INDEX IF NOT EXISTS producer_requests_status_idx ON public.producer_requests(status);
CREATE INDEX IF NOT EXISTS producer_requests_created_at_idx ON public.producer_requests(created_at);

-- Comments
COMMENT ON TABLE public.producer_requests IS 'Requests from users to become producers (theater groups).';
COMMENT ON COLUMN public.producer_requests.status IS 'Status of the request: pending, approved, rejected';


-- ============================================================================
-- 8. Create get_admin_dashboard_stats RPC Function
-- Source: 20260301000000_get_admin_stats.sql
-- ============================================================================

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
  pending_shows integer;
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
  SELECT count(*) INTO pending_shows FROM shows WHERE status = 'pending' AND deleted_at IS NULL;
  SELECT count(*) INTO approved_shows FROM shows WHERE status = 'approved' AND deleted_at IS NULL;
  SELECT count(*) INTO rejected_shows FROM shows WHERE status = 'rejected' AND deleted_at IS NULL;

  RETURN json_build_object(
    'totalUsers', total_users,
    'totalShows', total_shows,
    'activeProducers', active_producers,
    'pendingRequests', pending_requests,
    'deletedShows', deleted_shows,
    'pendingShows', pending_shows,
    'approvedShows', approved_shows,
    'rejectedShows', rejected_shows
  );
END;
$$;

-- Grant execute permission to authenticated users (the function itself checks for admin role)
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;


-- ============================================================================
-- 9. Finalize Schema Cache Reload
-- ============================================================================

NOTIFY pgrst, 'reload config';
