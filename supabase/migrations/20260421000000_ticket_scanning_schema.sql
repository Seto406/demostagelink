-- Add scanning columns to tickets table
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS thank_you_mail_sent BOOLEAN DEFAULT FALSE;

-- Add permission column to group_members
ALTER TABLE IF EXISTS public.group_members ADD COLUMN IF NOT EXISTS can_scan_tickets BOOLEAN DEFAULT FALSE;

-- Create an index on access_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_tickets_access_code ON public.tickets(access_code);

-- Function to generate a random 6-character alphanumeric code
CREATE OR REPLACE FUNCTION generate_ticket_access_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding I, O, 0, 1 for clarity
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically set access_code on insert if null
CREATE OR REPLACE FUNCTION set_ticket_access_code()
RETURNS TRIGGER AS $$
DECLARE
  code TEXT;
  collision_count INTEGER := 0;
BEGIN
  IF NEW.access_code IS NULL THEN
    LOOP
      code := generate_ticket_access_code();
      -- Check if code exists
      IF NOT EXISTS (SELECT 1 FROM public.tickets WHERE access_code = code) THEN
        NEW.access_code := code;
        EXIT;
      END IF;

      collision_count := collision_count + 1;
      IF collision_count > 10 THEN
        RAISE EXCEPTION 'Failed to generate unique access code after 10 attempts';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_ticket_access_code ON public.tickets;
CREATE TRIGGER trigger_set_ticket_access_code
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION set_ticket_access_code();

-- Backfill existing tickets that have no access_code
DO $$
DECLARE
  ticket_record RECORD;
  new_code TEXT;
BEGIN
  -- Only update tickets that need it
  FOR ticket_record IN SELECT id FROM public.tickets WHERE access_code IS NULL LOOP
    LOOP
      new_code := generate_ticket_access_code();
      BEGIN
        UPDATE public.tickets
        SET access_code = new_code
        WHERE id = ticket_record.id;
        EXIT; -- Exit loop if update succeeds (no unique constraint violation)
      EXCEPTION WHEN unique_violation THEN
        -- Retry if code already exists
      END;
    END LOOP;
  END LOOP;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
