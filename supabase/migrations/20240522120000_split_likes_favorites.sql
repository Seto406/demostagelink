-- Create show_likes table for hype/likes
CREATE TABLE IF NOT EXISTS public.show_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    show_id uuid REFERENCES public.shows(id) NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, show_id)
);

-- Enable RLS
ALTER TABLE public.show_likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public show_likes are viewable by everyone."
    ON public.show_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own show_likes."
    ON public.show_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own show_likes."
    ON public.show_likes FOR DELETE
    USING (auth.uid() = user_id);
