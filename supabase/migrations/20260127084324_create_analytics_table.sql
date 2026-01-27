-- Create analytics table for tracking show views and page visits
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('show_view', 'page_visit')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL,
  page_path TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analytics
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Analytics policies

-- Public users can insert analytics data (both anon and authenticated)
CREATE POLICY "Public users can insert analytics"
ON public.analytics FOR INSERT
WITH CHECK (true);

-- Only admins can view analytics data
CREATE POLICY "Admins can view analytics"
ON public.analytics FOR SELECT
USING (public.is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS analytics_created_at_idx ON public.analytics(created_at);
CREATE INDEX IF NOT EXISTS analytics_show_id_idx ON public.analytics(show_id);

-- Grant permissions
GRANT INSERT ON TABLE public.analytics TO anon, authenticated;
GRANT SELECT ON TABLE public.analytics TO authenticated;
