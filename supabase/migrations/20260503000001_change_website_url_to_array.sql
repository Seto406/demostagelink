ALTER TABLE public.profiles DROP COLUMN IF NOT EXISTS website_url;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_urls TEXT[];
