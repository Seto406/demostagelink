-- Migration: Ensure RLS and Reload Schema Cache
-- Description: Audit and enforce RLS on key tables, and reload PostgREST schema cache.

-- 1. Ensure RLS is enabled on key tables
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Verify/Re-apply Policies (Idempotent approach)
-- We drop and recreate policies to ensure they are correct.

-- Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Favorites
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

-- Subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Reload Schema Cache
NOTIFY pgrst, 'reload config';
