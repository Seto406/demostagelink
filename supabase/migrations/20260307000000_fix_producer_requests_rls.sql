-- Migration: Fix RLS permissions for producer_requests table

-- Enable RLS just in case
ALTER TABLE public.producer_requests ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users explicitly
GRANT INSERT, SELECT ON TABLE public.producer_requests TO authenticated;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own requests" ON public.producer_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.producer_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.producer_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.producer_requests;

-- RLS Policies

-- Users can insert their own request
CREATE POLICY "Users can insert own requests"
ON public.producer_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests (status check)
CREATE POLICY "Users can view own requests"
ON public.producer_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.producer_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update all requests (status approval/rejection)
CREATE POLICY "Admins can update all requests"
ON public.producer_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
