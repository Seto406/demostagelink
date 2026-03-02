-- Add slot tracking fields for time-slot ticketing
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS slot_id TEXT,
  ADD COLUMN IF NOT EXISTS slot_label TEXT;

CREATE INDEX IF NOT EXISTS idx_tickets_show_slot_status
  ON public.tickets(show_id, slot_id, status);
