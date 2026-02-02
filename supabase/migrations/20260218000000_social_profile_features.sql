-- Add social columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'Newbie',
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Create badges table
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

-- Create user_badges table
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

-- Create activities table
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

-- Seed some badges
INSERT INTO public.badges (name, description, slug, icon_url)
VALUES
  ('First Act', 'Created your account and joined the community.', 'first-act', '🎭'),
  ('Critic', 'Wrote your first review.', 'critic', '📝'),
  ('Theater Goer', 'Attended 5 shows.', 'theater-goer', '🎟️'),
  ('Supporter', 'Followed 3 theater groups.', 'supporter', '❤️')
ON CONFLICT (slug) DO NOTHING;
