-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, profile_id)
);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Policies for posts
CREATE POLICY "Public posts are viewable by everyone"
ON public.posts FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own posts"
ON public.posts FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

CREATE POLICY "Users can update their own posts"
ON public.posts FOR UPDATE
USING (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

CREATE POLICY "Users can delete their own posts"
ON public.posts FOR DELETE
USING (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

-- Policies for post_likes
CREATE POLICY "Public post_likes are viewable by everyone"
ON public.post_likes FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own likes"
ON public.post_likes FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

CREATE POLICY "Users can delete their own likes"
ON public.post_likes FOR DELETE
USING (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

-- Policies for post_comments
CREATE POLICY "Public post_comments are viewable by everyone"
ON public.post_comments FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own comments"
ON public.post_comments FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

CREATE POLICY "Users can delete their own comments"
ON public.post_comments FOR DELETE
USING (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- Storage Setup
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'post-media' );

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-media'
  AND auth.role() = 'authenticated'
);
