-- Create badges table if it doesn't exist (safety check)
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

-- Policy for badges
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'badges'
        AND policyname = 'Badges are viewable by everyone'
    ) THEN
        CREATE POLICY "Badges are viewable by everyone"
          ON public.badges FOR SELECT
          USING (true);
    END IF;
END $$;


-- Create user_badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policy for user_badges
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'user_badges'
        AND policyname = 'User badges are viewable by everyone'
    ) THEN
        CREATE POLICY "User badges are viewable by everyone"
          ON public.user_badges FOR SELECT
          USING (true);
    END IF;
END $$;
