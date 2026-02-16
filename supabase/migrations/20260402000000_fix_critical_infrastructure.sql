-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Optional link to a registered user
    member_name TEXT NOT NULL,
    role_in_group TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create group_audience_links table
CREATE TABLE IF NOT EXISTS public.group_audience_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    audience_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'invited', -- invited, accepted, rejected
    invited_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, audience_user_id)
);

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS group_logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS group_banner_url TEXT;

-- Create get_analytics_summary RPC function
CREATE OR REPLACE FUNCTION public.get_analytics_summary(group_id UUID)
RETURNS TABLE (
    views BIGINT,
    clicks BIGINT,
    ctr NUMERIC,
    chartData JSONB
) LANGUAGE plpgsql AS $$
DECLARE
    total_views BIGINT;
    total_clicks BIGINT;
    calculated_ctr NUMERIC;
    chart_data JSONB;
BEGIN
    -- Mock implementation: Returns 0s for now as requested for the fix.
    -- If analytics_events table exists, we could query it, but to ensure immediate stability:

    total_views := 0;
    total_clicks := 0;
    calculated_ctr := 0;
    chart_data := '[]'::jsonb;

    RETURN QUERY SELECT total_views, total_clicks, calculated_ctr, chart_data;
END;
$$;
