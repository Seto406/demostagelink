-- Add theater_group_id to shows table
ALTER TABLE public.shows
ADD COLUMN IF NOT EXISTS theater_group_id UUID REFERENCES public.theater_groups(id) ON DELETE CASCADE;

-- Create index for theater_group_id
CREATE INDEX IF NOT EXISTS shows_theater_group_id_idx ON public.shows(theater_group_id);

-- Backfill theater_group_id based on producer_id (owner_id in theater_groups)
UPDATE public.shows s
SET theater_group_id = tg.id
FROM public.theater_groups tg
WHERE s.producer_id = tg.owner_id
AND s.theater_group_id IS NULL;

-- Update RLS policies to include theater_group_id checks
-- We keep producer_id checks for backward compatibility

-- Policy for producers to view their own shows
DROP POLICY IF EXISTS "Producers can view own shows" ON public.shows;
CREATE POLICY "Producers can view own shows"
ON public.shows
FOR SELECT
USING (
  producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR
  theater_group_id IN (
    SELECT id FROM public.theater_groups WHERE owner_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Policy for producers to insert shows
DROP POLICY IF EXISTS "Producers can insert shows" ON public.shows;
CREATE POLICY "Producers can insert shows"
ON public.shows
FOR INSERT
WITH CHECK (
  (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  OR
  (theater_group_id IN (
    SELECT id FROM public.theater_groups WHERE owner_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ))
);

-- Policy for producers to update their own shows
DROP POLICY IF EXISTS "Producers can update own shows" ON public.shows;
CREATE POLICY "Producers can update own shows"
ON public.shows
FOR UPDATE
USING (
  (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  OR
  (theater_group_id IN (
    SELECT id FROM public.theater_groups WHERE owner_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ))
);

-- Policy for producers to delete their own shows
DROP POLICY IF EXISTS "Producers can delete own shows" ON public.shows;
CREATE POLICY "Producers can delete own shows"
ON public.shows
FOR DELETE
USING (
  (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  OR
  (theater_group_id IN (
    SELECT id FROM public.theater_groups WHERE owner_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ))
);
