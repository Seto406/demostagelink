-- Migration: Fix Schema Mismatches and Producer Request FK
-- Description: Ensures notifications, subscriptions, favorites exist and fixes producer_requests FK.

-- ============================================================================
-- 1. Ensure Notifications Table Exists
-- ============================================================================

-- If table exists but schema is stale/broken, we recreate it if needed?
-- No, recreating data tables is dangerous. We only create IF NOT EXISTS.
-- However, if the existing definition is wrong (e.g. references profiles.id), we might want to alter it.
-- But changing FK on existing data might be complex if data violates new FK.
-- Assuming table is missing or empty/broken given the reports.

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Ensure this references auth.users(id)
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  type TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
-- Drop existing policies to ensure they use correct logic
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- Create policy using auth.uid() directly
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Admins policy
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================================
-- 2. Ensure Subscriptions Table Exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(user_id) not null unique, -- References unique user_id in profiles (effectively auth.users.id)
  status text check (status in ('active', 'inactive', 'past_due', 'canceled')) default 'inactive',
  tier text check (tier in ('free', 'pro')) default 'free',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS on_subscription_updated ON public.subscriptions;
CREATE TRIGGER on_subscription_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_subscription_updated_at();


-- ============================================================================
-- 3. Ensure Favorites Table Exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Ensure references auth.users(id)
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, show_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Policies for favorites
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
CREATE POLICY "Users can add their own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;
CREATE POLICY "Users can remove their own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view favorites" ON public.favorites;
CREATE POLICY "Anyone can view favorites"
  ON public.favorites FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_show_id_idx ON public.favorites(show_id);


-- ============================================================================
-- 4. Fix Producer Requests FK
-- ============================================================================

-- Explicitly drop the constraint if it references profiles or anything else
ALTER TABLE public.producer_requests DROP CONSTRAINT IF EXISTS producer_requests_user_id_fkey;

-- Add the correct constraint referencing auth.users(id)
-- This fixes the "key is not present in the profiles table" error by bypassing profiles check entirely
ALTER TABLE public.producer_requests
  ADD CONSTRAINT producer_requests_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;


-- ============================================================================
-- 5. Reload Schema Cache
-- ============================================================================

NOTIFY pgrst, 'reload config';
