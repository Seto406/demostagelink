-- Add social media columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN facebook_url TEXT,
ADD COLUMN instagram_url TEXT;