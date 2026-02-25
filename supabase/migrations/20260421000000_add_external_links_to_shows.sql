ALTER TABLE "public"."shows" ADD COLUMN "external_links" jsonb DEFAULT '[]'::jsonb;
