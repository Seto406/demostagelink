-- Phase 3: Producer Dashboard + XP engine support
ALTER TABLE public.group_members
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own user stats" ON public.user_stats;
CREATE POLICY "Users can view their own user stats"
ON public.user_stats FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert user stats" ON public.user_stats;
CREATE POLICY "Authenticated users can insert user stats"
ON public.user_stats FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update user stats" ON public.user_stats;
CREATE POLICY "Authenticated users can update user stats"
ON public.user_stats FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON public.user_stats;
CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
