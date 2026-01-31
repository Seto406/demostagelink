-- Migration: Initialize profiles, groups (as profiles), and Phase 2 analytics_events tables
-- Note: Groups are represented as profiles with role='producer', not a separate table

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Create enum for user roles (includes 'admin' for Phase 2)
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('audience', 'producer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure 'admin' is added if enum already exists
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for show status
DO $$ BEGIN
  CREATE TYPE public.show_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for niche type
DO $$ BEGIN
  CREATE TYPE public.niche_type AS ENUM ('local', 'university');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PROFILES TABLE (represents both users and groups)
-- Groups are profiles with role='producer'
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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
  gallery_images TEXT[],
  ticket_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Profiles RLS Policies
-- Anyone can view profiles (for directory)
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- ANALYTICS_EVENTS TABLE (Phase 2)
-- ============================================================================

-- Note: This table references public.shows(id). If shows table doesn't exist yet,
-- you may need to create it first or remove the foreign key constraint temporarily.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  group_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meta JSONB
);

-- Add foreign key constraint for show_id if shows table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shows') THEN
    -- Drop existing constraint if it exists
    ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_show_id_fkey;
    -- Add foreign key constraint
    ALTER TABLE public.analytics_events 
    ADD CONSTRAINT analytics_events_show_id_fkey 
    FOREIGN KEY (show_id) REFERENCES public.shows(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Producers can view their own analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics_events;

-- Analytics Events RLS Policies

-- Allow anyone to insert events (e.g. clicking a button)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (true);

-- Allow producers to view events for their own group
CREATE POLICY "Producers can view their own analytics"
ON public.analytics_events FOR SELECT
USING (
  group_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Allow admins to view all analytics
CREATE POLICY "Admins can view all analytics"
ON public.analytics_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS analytics_events_group_id_idx ON public.analytics_events(group_id);
CREATE INDEX IF NOT EXISTS analytics_events_show_id_idx ON public.analytics_events(show_id);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON public.analytics_events(created_at);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_niche_idx ON public.profiles(niche);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'audience'))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for automatic timestamp updates on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles. Groups are represented as profiles with role=''producer''. Audience members have role=''audience''.';
COMMENT ON TABLE public.analytics_events IS 'Phase 2 analytics events table for tracking user interactions (ticket clicks, profile views, etc.)';
COMMENT ON COLUMN public.profiles.role IS 'User role: audience, producer (group), or admin';
COMMENT ON COLUMN public.profiles.group_name IS 'Name of the group (only for profiles with role=''producer'')';
COMMENT ON COLUMN public.analytics_events.event_type IS 'Type of event (e.g., ''ticket_click'', ''profile_view'')';
COMMENT ON COLUMN public.analytics_events.group_id IS 'Reference to the group (profile with role=''producer'') that this event relates to';
COMMENT ON COLUMN public.analytics_events.meta IS 'Additional metadata about the event stored as JSON';
