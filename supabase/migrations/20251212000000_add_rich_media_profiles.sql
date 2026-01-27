-- Add gallery_images and video_url columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS video_url text;
