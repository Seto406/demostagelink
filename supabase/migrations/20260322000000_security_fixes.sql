-- 1. Close the Email Leak: Drop the view public.users_with_emails immediately.
DROP VIEW IF EXISTS public.users_with_emails;

-- 2. Enable RLS on All Tables (Ensure they are enabled)
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Create Proper RLS Policies

-- ============================================================================
-- FAVORITES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;

-- Create new strict policy: SELECT and ALL where user_id = auth.uid()
-- Assumption: favorites.user_id references auth.users(id) as requested.
CREATE POLICY "Users can manage their own favorites"
ON public.favorites
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

-- Create new strict policy: SELECT and ALL where user_id = auth.uid()
-- Assumption: notifications.user_id references auth.users(id) as requested.
CREATE POLICY "Users can manage their own notifications"
ON public.notifications
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;

-- Create new strict policy: only owner can view/edit
-- Assumption: subscriptions.user_id references auth.users(id).
CREATE POLICY "Users can manage own subscription"
ON public.subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Reload schema cache to ensure changes take effect immediately
NOTIFY pgrst, 'reload schema';
