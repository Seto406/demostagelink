-- 1. Close the Email Leak: Drop the view public.users_with_emails immediately.
DROP VIEW IF EXISTS public.users_with_emails;

-- 2. Remove Gamification Tables (Feature Removed)
DROP TABLE IF EXISTS public.user_badges;
DROP TABLE IF EXISTS public.badges;

-- 3. Enable RLS and Add Policies for theater_groups
ALTER TABLE public.theater_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.theater_groups;
CREATE POLICY "Public profiles are viewable by everyone." ON public.theater_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own theater_groups." ON public.theater_groups;
CREATE POLICY "Users can insert their own theater_groups." ON public.theater_groups FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own theater_groups." ON public.theater_groups;
CREATE POLICY "Users can update own theater_groups." ON public.theater_groups FOR UPDATE USING (auth.uid() = owner_id);

-- 4. Enable RLS and Add Policies for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow others" ON public.follows;
CREATE POLICY "Users can unfollow others" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- 5. Enable RLS and Add Policies for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Producers can delete reviews of their shows" ON public.reviews;
CREATE POLICY "Producers can delete reviews of their shows" ON public.reviews FOR DELETE USING (EXISTS (SELECT 1 FROM public.shows WHERE shows.id = reviews.show_id AND shows.producer_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- 6. Enable RLS and Add Policies for group_audience_links
ALTER TABLE public.group_audience_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View links" ON public.group_audience_links;
CREATE POLICY "View links" ON public.group_audience_links FOR SELECT USING (auth.uid() = group_id OR auth.uid() = audience_user_id);

DROP POLICY IF EXISTS "Create links" ON public.group_audience_links;
CREATE POLICY "Create links" ON public.group_audience_links FOR INSERT WITH CHECK (auth.uid() = group_id);

DROP POLICY IF EXISTS "Update links" ON public.group_audience_links;
CREATE POLICY "Update links" ON public.group_audience_links FOR UPDATE USING (auth.uid() = group_id OR auth.uid() = audience_user_id);

DROP POLICY IF EXISTS "Delete links" ON public.group_audience_links;
CREATE POLICY "Delete links" ON public.group_audience_links FOR DELETE USING (auth.uid() = group_id);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
