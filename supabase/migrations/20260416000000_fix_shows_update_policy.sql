-- Fix RLS policy for updating shows to allow creators and group members
DROP POLICY IF EXISTS "Producers can update own shows" ON public.shows;

CREATE POLICY "Producers can update own shows"
ON public.shows
FOR UPDATE
USING (
  -- 1. Creator (Producer) - matches profile ID
  (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  OR
  -- 2. Group Owner - matches group owner's profile ID
  (theater_group_id IN (
    SELECT id FROM public.theater_groups WHERE owner_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ))
  OR
  -- 3. Group Producer (Member) - matches group member record
  (theater_group_id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid()
    AND status = 'active'
    AND role_in_group IN ('producer', 'admin')
  ))
);
