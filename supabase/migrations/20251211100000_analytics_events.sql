-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  group_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meta JSONB
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies

-- Allow anyone to insert events (e.g. clicking a button)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (true);

-- Allow producers to view events for their own group
CREATE POLICY "Producers can view their own analytics"
ON public.analytics_events FOR SELECT
USING (
  group_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);
