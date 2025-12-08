-- Create storage bucket for show posters
INSERT INTO storage.buckets (id, name, public)
VALUES ('posters', 'posters', true);

-- Allow authenticated users to upload posters
CREATE POLICY "Authenticated users can upload posters"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posters');

-- Allow anyone to view posters (public bucket)
CREATE POLICY "Anyone can view posters"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posters');

-- Allow users to update their own posters
CREATE POLICY "Users can update own posters"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'posters' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own posters
CREATE POLICY "Users can delete own posters"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'posters' AND auth.uid()::text = (storage.foldername(name))[1]);