-- Add likes_count column to shows table
ALTER TABLE shows ADD COLUMN likes_count INTEGER DEFAULT 0;

-- Create function to increment likes count atomically
CREATE OR REPLACE FUNCTION increment_likes(show_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE shows
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = show_id;
END;
$$ LANGUAGE plpgsql;
