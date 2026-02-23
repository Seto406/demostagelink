DROP FUNCTION IF EXISTS public.add_xp(INTEGER);
DROP FUNCTION IF EXISTS public.award_badge(TEXT);
DROP TABLE IF EXISTS public.user_stats;
DROP TABLE IF EXISTS public.user_badges;
DROP TABLE IF EXISTS public.badges;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS xp;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS rank;
