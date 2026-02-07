-- Migration to change cast_members from text[] to JSONB

-- 1. Add temporary JSONB column
ALTER TABLE public.shows ADD COLUMN cast_members_jsonb JSONB;

-- 2. Migrate existing data
-- Convert text[] (names) to JSONB array of objects [{ "name": "Name", "role": "Cast" }]
UPDATE public.shows
SET cast_members_jsonb = (
  SELECT jsonb_agg(
    jsonb_build_object('name', elem, 'role', 'Cast')
  )
  FROM unnest(cast_members) AS elem
)
WHERE cast_members IS NOT NULL AND cardinality(cast_members) > 0;

-- 3. Drop old column
ALTER TABLE public.shows DROP COLUMN cast_members;

-- 4. Rename new column
ALTER TABLE public.shows RENAME COLUMN cast_members_jsonb TO cast_members;
