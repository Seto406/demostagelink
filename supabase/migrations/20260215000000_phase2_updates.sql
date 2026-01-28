ALTER TABLE "public"."shows" ADD COLUMN "production_status" text NOT NULL DEFAULT 'ongoing';

ALTER TABLE "public"."shows" ADD CONSTRAINT "shows_production_status_check" CHECK (production_status IN ('ongoing', 'completed', 'draft'));
