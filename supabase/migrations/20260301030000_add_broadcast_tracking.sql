ALTER TABLE "public"."shows" ADD COLUMN "last_broadcast_at" TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN "public"."shows"."last_broadcast_at" IS 'Timestamp of when the show was last broadcast to the audience.';
