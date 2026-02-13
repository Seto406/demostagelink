-- Migration: Fix Production Sync (Emergency Patch)
-- Description: Recreates missing RPCs, tables, and fixes Foreign Key relationships causing 400/404 errors.
-- Run this in Supabase SQL Editor if needed, or apply via migration pipeline.

-- ============================================================================
-- 1. Create Invitations Table (Fixes 404 Missing Logic)
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
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.invitations
    SET status = 'accepted', accepted_at = NEW.email_confirmed_at
    WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users (requires superuser privileges)
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_invitation_acceptance();


-- ============================================================================
-- 2. Create Producer Requests Table (Dependency for Admin Stats)
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

ALTER TABLE public.producer_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for producer_requests
DROP POLICY IF EXISTS "Users can insert own requests" ON public.producer_requests;
CREATE POLICY "Users can insert own requests" ON public.producer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own requests" ON public.producer_requests;
CREATE POLICY "Users can view own requests" ON public.producer_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all requests" ON public.producer_requests;
CREATE POLICY "Admins can view all requests" ON public.producer_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update all requests" ON public.producer_requests;
CREATE POLICY "Admins can update all requests" ON public.producer_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);


-- ============================================================================
-- 3. Create get_admin_dashboard_stats RPC Function (Fixes 404 Missing Logic)
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

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;


-- ============================================================================
-- 4. Fix Favorites Table (Fixes 400 Column Mismatch)
-- ============================================================================

-- Drop table to resolve schema conflicts (e.g. user_id pointing to auth.users vs profiles)
-- This is necessary as column types/constraints might conflict.
DROP TABLE IF EXISTS public.favorites CASCADE;

CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- MUST reference profiles(id)
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, show_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Policies for favorites
CREATE POLICY "Anyone can view favorites" ON public.favorites FOR SELECT USING (true);

CREATE POLICY "Users can add their own favorites" ON public.favorites FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = favorites.user_id)
);

CREATE POLICY "Users can remove their own favorites" ON public.favorites FOR DELETE USING (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = favorites.user_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_show_id_idx ON public.favorites(show_id);


-- ============================================================================
-- 5. Fix Shows Table Relationships (Fixes 400 Column Mismatch)
-- ============================================================================

-- Ensure shows.producer_id references public.profiles(id)
-- First drop existing constraint to be safe (name might vary, so we use IF EXISTS)
ALTER TABLE public.shows DROP CONSTRAINT IF EXISTS shows_producer_id_fkey;

-- If there are any other constraints on producer_id that point to auth.users, they should be dropped.
-- We can't easily guess names, but standard naming is table_column_fkey.

-- Add the correct constraint
ALTER TABLE public.shows
  ADD CONSTRAINT shows_producer_id_fkey
  FOREIGN KEY (producer_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS shows_producer_id_idx ON public.shows(producer_id);


-- ============================================================================
-- 6. Fix Username Column (Fixes "column does not exist" Error)
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;


-- ============================================================================
-- 7. Create get_admin_user_list RPC (Fixes 404 Missing Logic)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_user_list(
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_total_count BIGINT;
  v_users JSON;
BEGIN
  -- Check if user is admin (Restrict access only for API calls)
  IF session_user = 'authenticator' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;

  v_offset := (page_number - 1) * page_size;

  -- Get total count
  SELECT COUNT(*) INTO v_total_count FROM auth.users;

  SELECT json_agg(t) INTO v_users
  FROM (
    SELECT
      p.id as id, -- Profile ID (can be null if user has no profile)
      u.id as user_id, -- Auth ID
      u.email,
      COALESCE(p.role::TEXT, 'audience') as role,
      p.group_name,
      u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    ORDER BY u.created_at DESC
    LIMIT page_size
    OFFSET v_offset
  ) t;

  RETURN json_build_object(
    'users', COALESCE(v_users, '[]'::json),
    'total_count', v_total_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_user_list(INTEGER, INTEGER) TO authenticated;


-- ============================================================================
-- 8. Reload Schema Cache (Fixes Persistence of Errors)
-- ============================================================================

NOTIFY pgrst, 'reload config';
