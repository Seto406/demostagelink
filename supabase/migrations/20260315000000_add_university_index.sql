-- Add index for university column in profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_university ON public.profiles(university);
