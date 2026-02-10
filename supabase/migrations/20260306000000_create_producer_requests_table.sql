-- Migration: Create producer_requests table

-- Create producer_requests table
CREATE TABLE IF NOT EXISTS public.producer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  portfolio_link TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT producer_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable Row Level Security
ALTER TABLE public.producer_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
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

-- Users can view their own requests
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

-- Admins can update all requests
CREATE POLICY "Admins can update all requests"
ON public.producer_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS producer_requests_user_id_idx ON public.producer_requests(user_id);
CREATE INDEX IF NOT EXISTS producer_requests_status_idx ON public.producer_requests(status);
CREATE INDEX IF NOT EXISTS producer_requests_created_at_idx ON public.producer_requests(created_at);

-- Comments
COMMENT ON TABLE public.producer_requests IS 'Requests from users to become producers (theater groups).';
COMMENT ON COLUMN public.producer_requests.status IS 'Status of the request: pending, approved, rejected';
