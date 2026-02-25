-- Add genres and has_completed_onboarding to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;
