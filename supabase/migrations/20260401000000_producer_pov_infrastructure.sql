-- Migration for Producer POV Infrastructure

-- 1. Ensure shows table has required columns
ALTER TABLE public.shows
ADD COLUMN IF NOT EXISTS performance_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS poster_url TEXT,
ADD COLUMN IF NOT EXISTS cast_members JSONB;

-- 2. Migrate existing date to performance_date (assuming midnight UTC for existing dates)
UPDATE public.shows
SET performance_date = date::timestamp AT TIME ZONE 'UTC'
WHERE performance_date IS NULL AND date IS NOT NULL;

-- 3. Create show-posters storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('show-posters', 'show-posters', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Set up Storage Policies for show-posters

-- Allow public read access
DROP POLICY IF EXISTS "Public Access show-posters" ON storage.objects;
CREATE POLICY "Public Access show-posters"
ON storage.objects FOR SELECT
USING (bucket_id = 'show-posters');

-- Allow Producers and Admins to upload
DROP POLICY IF EXISTS "Producer Upload show-posters" ON storage.objects;
CREATE POLICY "Producer Upload show-posters"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'show-posters' AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND (role = 'producer' OR role = 'admin')
    )
  )
);

-- Allow Users to update their own uploads
DROP POLICY IF EXISTS "Producer Update show-posters" ON storage.objects;
CREATE POLICY "Producer Update show-posters"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'show-posters' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow Users to delete their own uploads
DROP POLICY IF EXISTS "Producer Delete show-posters" ON storage.objects;
CREATE POLICY "Producer Delete show-posters"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'show-posters' AND auth.uid()::text = (storage.foldername(name))[1]
);
