-- Migration: Add Premium Production Suite columns to shows table
-- This aligns the schema with the "Production Suite" requirements.

-- Capacity & Inventory
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS total_capacity INTEGER;
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS remaining_seats INTEGER;

-- Financials
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS ticket_price NUMERIC;
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PHP';

-- Backfill ticket_price from price if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shows' AND column_name = 'price') THEN
    UPDATE public.shows SET ticket_price = price WHERE ticket_price IS NULL AND price IS NOT NULL;
  END IF;
END $$;

-- Scheduling
-- show_time already exists as TIMESTAMPTZ (added in 20260219000000_show_reminders.sql)
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Venue Details
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS venue_address TEXT;
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS map_link TEXT;

-- Update comments
COMMENT ON COLUMN public.shows.total_capacity IS 'Total seating capacity for the show';
COMMENT ON COLUMN public.shows.remaining_seats IS 'Remaining available seats';
COMMENT ON COLUMN public.shows.ticket_price IS 'Price per ticket';
COMMENT ON COLUMN public.shows.currency IS 'Currency code (default PHP)';
COMMENT ON COLUMN public.shows.duration_minutes IS 'Duration of the show in minutes';
COMMENT ON COLUMN public.shows.venue_address IS 'Physical address of the venue';
COMMENT ON COLUMN public.shows.map_link IS 'URL to map location (e.g. Google Maps)';
