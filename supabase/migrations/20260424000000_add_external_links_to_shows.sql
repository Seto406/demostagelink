ALTER TABLE "public"."shows" ADD COLUMN "external_links" jsonb DEFAULT '[]'::jsonb;

-- Backfill data: Migrate existing ticket_link to external_links array
UPDATE public.shows
SET external_links = jsonb_build_array(ticket_link)
WHERE ticket_link IS NOT NULL AND ticket_link != '';
