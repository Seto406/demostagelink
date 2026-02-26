-- Add deleted_at column to comments
DO $$ BEGIN
    ALTER TABLE public.comments ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add deleted_at column to post_comments
DO $$ BEGIN
    ALTER TABLE public.post_comments ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- RLS Policies for comments (UPDATE)

-- 1. Comment Author (can delete own comment)
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments
FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- 2. Show Producer (can moderate comments on their show)
DROP POLICY IF EXISTS "Producers can moderate show comments" ON public.comments;
CREATE POLICY "Producers can moderate show comments" ON public.comments
FOR UPDATE
USING (
  show_id IN (
    SELECT id
    FROM public.shows
    WHERE producer_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- 3. Admin (can moderate any comment)
DROP POLICY IF EXISTS "Admins can moderate comments" ON public.comments;
CREATE POLICY "Admins can moderate comments" ON public.comments
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);


-- RLS Policies for post_comments (UPDATE)

-- 1. Comment Author (can delete own comment)
DROP POLICY IF EXISTS "Users can delete own post comments" ON public.post_comments;
CREATE POLICY "Users can delete own post comments" ON public.post_comments
FOR UPDATE
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- 2. Post Author (can moderate comments on their post)
DROP POLICY IF EXISTS "Post authors can moderate post comments" ON public.post_comments;
CREATE POLICY "Post authors can moderate post comments" ON public.post_comments
FOR UPDATE
USING (
  post_id IN (
    SELECT id
    FROM public.posts
    WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- 3. Admin (can moderate any post comment)
DROP POLICY IF EXISTS "Admins can moderate post comments" ON public.post_comments;
CREATE POLICY "Admins can moderate post comments" ON public.post_comments
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);
