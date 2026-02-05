-- Re-create favorites table to link to profiles instead of auth.users
-- This aligns with other social features (reviews, activities) and ensures consistency.

DROP TABLE IF EXISTS public.favorites;

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
CREATE POLICY "Anyone can view favorites"
ON public.favorites FOR SELECT
USING (true);

-- Users can insert their own favorites
-- Check if the auth.uid() owns the profile that is being used as user_id
CREATE POLICY "Users can add their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = favorites.user_id
  )
);

-- Users can remove their own favorites
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
