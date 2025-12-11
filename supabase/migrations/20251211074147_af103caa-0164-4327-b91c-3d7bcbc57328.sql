-- Add soft delete column to shows table
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better query performance on non-deleted shows
CREATE INDEX IF NOT EXISTS idx_shows_deleted_at ON public.shows(deleted_at);

-- Update RLS policy to exclude soft-deleted shows from public view
DROP POLICY IF EXISTS "Anyone can view approved shows" ON public.shows;
CREATE POLICY "Anyone can view approved shows" 
ON public.shows 
FOR SELECT 
USING (status = 'approved' AND deleted_at IS NULL);

-- Admins can still see all shows including deleted ones
DROP POLICY IF EXISTS "Admins can view all shows" ON public.shows;
CREATE POLICY "Admins can view all shows" 
ON public.shows 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Producers can view their own shows (including soft-deleted for recovery)
DROP POLICY IF EXISTS "Producers can view own shows" ON public.shows;
CREATE POLICY "Producers can view own shows" 
ON public.shows 
FOR SELECT 
USING (producer_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));