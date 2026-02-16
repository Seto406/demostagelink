-- 1. Add the missing column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN DEFAULT FALSE;
