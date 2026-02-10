-- Sync migration to handle schema drift
-- Ensuring all columns required by frontend exist

DO $$
BEGIN
    -- cast_members (JSONB)
    -- If it doesn't exist, add it as JSONB.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shows' AND column_name = 'cast_members') THEN
        ALTER TABLE public.shows ADD COLUMN cast_members JSONB DEFAULT '[]'::jsonb;
    ELSE
        -- If it exists but is not JSONB (e.g. TEXT[] from old migration), we convert it.
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'shows' AND column_name = 'cast_members') != 'jsonb' THEN
             -- Convert to JSONB. Using TO_JSONB for array might be needed if it's text[].
             -- But usually cast_members::jsonb works for text[] if format is valid json array string,
             -- wait, text[] in postgres is '{a,b}'. Casting to jsonb gives '["a","b"]'.
             -- So cast should work.
             ALTER TABLE public.shows ALTER COLUMN cast_members TYPE JSONB USING to_jsonb(cast_members);
        END IF;
    END IF;

    -- tags (TEXT[])
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shows' AND column_name = 'tags') THEN
        ALTER TABLE public.shows ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;

    -- seo_metadata (JSONB)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shows' AND column_name = 'seo_metadata') THEN
        ALTER TABLE public.shows ADD COLUMN seo_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- production_status (TEXT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shows' AND column_name = 'production_status') THEN
        ALTER TABLE public.shows ADD COLUMN production_status TEXT DEFAULT 'ongoing';
        ALTER TABLE public.shows ADD CONSTRAINT shows_production_status_check CHECK (production_status IN ('ongoing', 'completed', 'draft'));
    END IF;

    -- genre (TEXT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shows' AND column_name = 'genre') THEN
        ALTER TABLE public.shows ADD COLUMN genre TEXT;
    END IF;

    -- director (TEXT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shows' AND column_name = 'director') THEN
        ALTER TABLE public.shows ADD COLUMN director TEXT;
    END IF;

    -- duration (TEXT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shows' AND column_name = 'duration') THEN
        ALTER TABLE public.shows ADD COLUMN duration TEXT;
    END IF;

END $$;
