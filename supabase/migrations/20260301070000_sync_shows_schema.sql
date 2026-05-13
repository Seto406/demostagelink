-- Sync shows table schema with frontend requirements
-- This migration ensures all necessary columns exist for the show creation form

-- 1. Create ENUM types if they don't exist
DO $$ BEGIN
    CREATE TYPE public.niche_type AS ENUM ('local', 'university');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.show_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add columns to 'shows' table
ALTER TABLE public.shows
ADD COLUMN IF NOT EXISTS producer_id UUID REFERENCES public.profiles(id) NOT NULL,
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS venue TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS niche public.niche_type,
ADD COLUMN IF NOT EXISTS status public.show_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS production_status TEXT DEFAULT 'ongoing',
ADD COLUMN IF NOT EXISTS poster_url TEXT,
ADD COLUMN IF NOT EXISTS ticket_link TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS director TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS cast_members JSONB,
ADD COLUMN IF NOT EXISTS seo_metadata JSONB,
ADD COLUMN IF NOT EXISTS show_time TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shows_producer_id ON public.shows(producer_id);
CREATE INDEX IF NOT EXISTS idx_shows_status ON public.shows(status);
CREATE INDEX IF NOT EXISTS idx_shows_date ON public.shows(date);
