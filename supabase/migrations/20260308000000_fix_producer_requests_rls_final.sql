-- Migration: Fix RLS permissions for producer_requests table (Final Fix)
-- Description: Ensures INSERT/SELECT permissions are granted and RLS policies allow users to submit requests.

-- Enable RLS (idempotent)
ALTER TABLE public.producer_requests ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users explicitly
-- GRANT INSERT, SELECT needed for users to submit and view status
-- GRANT UPDATE needed for admins (who are also 'authenticated' role users) to approve/reject
GRANT INSERT, SELECT, UPDATE ON TABLE public.producer_requests TO authenticated;

-- Drop existing policies to avoid conflicts and ensure clean state
DROP POLICY IF EXISTS "Users can insert own requests" ON public.producer_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.producer_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.producer_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.producer_requests;

-- RLS Policies

-- Users can insert their own request
-- Condition: auth.uid() must match the user_id in the row being inserted
CREATE POLICY "Users can insert own requests"
ON public.producer_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests (status check)
-- Condition: auth.uid() must match the user_id in the row
CREATE POLICY "Users can view own requests"
ON public.producer_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all requests
-- Condition: User must have 'admin' role in public.profiles
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
-- Condition: User must have 'admin' role in public.profiles
CREATE POLICY "Admins can update all requests"
ON public.producer_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
