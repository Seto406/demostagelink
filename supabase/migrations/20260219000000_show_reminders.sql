-- Add show_time to shows
ALTER TABLE public.shows
ADD COLUMN IF NOT EXISTS show_time TIMESTAMP WITH TIME ZONE;

-- Backfill show_time from date (defaulting to 7 PM UTC)
-- Only for rows where show_time is null and date is not null
UPDATE public.shows
SET show_time = (date || ' 19:00:00+00')::timestamptz
WHERE show_time IS NULL AND date IS NOT NULL;

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlist')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Tickets policies
-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
ON public.tickets FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own tickets (Buying/RSVPing)
CREATE POLICY "Users can insert their own tickets"
ON public.tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (Cancelling)
CREATE POLICY "Users can update their own tickets"
ON public.tickets FOR UPDATE
USING (auth.uid() = user_id);

-- Producers can view tickets for their shows
CREATE POLICY "Producers can view tickets for their shows"
ON public.tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shows
    WHERE id = tickets.show_id
    AND producer_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the job (Placeholder)
-- To enable this, run the following command in your Supabase SQL Editor,
-- replacing YOUR_SERVICE_ROLE_KEY and YOUR_PROJECT_REF with your actual values.
--
-- SELECT cron.schedule(
--   'show-reminders',
--   '0 * * * *', -- Every hour
--   $$
--   select net.http_post(
--       url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-show-reminder',
--       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
--   ) as request_id;
--   $$
-- );
