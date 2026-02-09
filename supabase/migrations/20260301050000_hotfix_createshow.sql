-- Hotfix for Create Show Flow: Storage and Table Policies

-- 1. Storage Policies Fix
-- Buckets: posters, avatars, AND show-posters (just in case)

-- Drop existing restrictive policies for 'posters' and 'avatars' to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload posters" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own posters" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own posters" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Re-create policies with explicit permissions for 'posters'
-- Allow any authenticated user to insert/upload to 'posters' bucket
CREATE POLICY "Authenticated users can upload posters"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posters');

-- Allow users to update their own objects in 'posters' (based on owner)
CREATE POLICY "Users can update own posters"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'posters' AND auth.uid() = owner);

-- Allow users to delete their own objects in 'posters'
CREATE POLICY "Users can delete own posters"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'posters' AND auth.uid() = owner);

-- Ensure public access is maintained for 'posters'
DROP POLICY IF EXISTS "Anyone can view posters" ON storage.objects;
CREATE POLICY "Anyone can view posters"
ON storage.objects FOR SELECT
USING (bucket_id = 'posters');

-- Re-create policies with explicit permissions for 'avatars'
-- Allow any authenticated user to insert/upload to 'avatars' bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow users to update their own objects in 'avatars'
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Allow users to delete their own objects in 'avatars'
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Ensure public access is maintained for 'avatars'
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Add policies for 'show-posters' (just in case the bucket is named this way in live environment)
-- Drop existing potential policies
DROP POLICY IF EXISTS "Authenticated users can upload show-posters" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own show-posters" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own show-posters" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view show-posters" ON storage.objects;

-- Create policies for 'show-posters'
CREATE POLICY "Authenticated users can upload show-posters"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'show-posters');

CREATE POLICY "Users can update own show-posters"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'show-posters' AND auth.uid() = owner);

CREATE POLICY "Users can delete own show-posters"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'show-posters' AND auth.uid() = owner);

CREATE POLICY "Anyone can view show-posters"
ON storage.objects FOR SELECT
USING (bucket_id = 'show-posters');


-- 2. Database Policy Fix for public.shows
-- Drop existing policy
DROP POLICY IF EXISTS "Producers can insert shows" ON public.shows;

-- Create robust policy checking for producer role and ownership
CREATE POLICY "Producers can insert shows"
ON public.shows
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = producer_id
    AND user_id = auth.uid()
    AND role = 'producer'
  )
);
