-- Create show_analytics table
CREATE TABLE IF NOT EXISTS public.show_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(show_id, date)
);

-- Enable RLS
ALTER TABLE public.show_analytics ENABLE ROW LEVEL SECURITY;

-- Policies

-- Producers can view analytics for their own shows
CREATE POLICY "Producers can view analytics for their own shows"
ON public.show_analytics FOR SELECT
USING (
  show_id IN (
    SELECT id FROM public.shows WHERE producer_id = auth.uid()
  )
);

-- Functions for atomic increments

-- Increment Show View
CREATE OR REPLACE FUNCTION increment_show_view(show_id_input UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.show_analytics (show_id, date, views)
  VALUES (show_id_input, CURRENT_DATE, 1)
  ON CONFLICT (show_id, date)
  DO UPDATE SET views = show_analytics.views + 1, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment Show Click
CREATE OR REPLACE FUNCTION increment_show_click(show_id_input UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.show_analytics (show_id, date, clicks)
  VALUES (show_id_input, CURRENT_DATE, 1)
  ON CONFLICT (show_id, date)
  DO UPDATE SET clicks = show_analytics.clicks + 1, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
