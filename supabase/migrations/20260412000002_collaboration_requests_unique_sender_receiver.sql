-- Ensure one collaboration request row per sender/receiver pair.
-- Keep the most recently created row when historical duplicates already exist.
WITH ranked_requests AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY sender_id, receiver_id
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.collaboration_requests
)
DELETE FROM public.collaboration_requests cr
USING ranked_requests rr
WHERE cr.id = rr.id
  AND rr.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS collaboration_requests_sender_receiver_unique_idx
  ON public.collaboration_requests (sender_id, receiver_id);
