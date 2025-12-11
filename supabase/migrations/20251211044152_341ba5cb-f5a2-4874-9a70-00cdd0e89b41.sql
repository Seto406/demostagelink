-- Create producer_requests table for users requesting to become producers
CREATE TABLE public.producer_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name text NOT NULL,
  portfolio_link text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.producer_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.producer_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users can insert own requests"
ON public.producer_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.producer_requests
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update all requests
CREATE POLICY "Admins can update all requests"
ON public.producer_requests
FOR UPDATE
USING (is_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_producer_requests_updated_at
BEFORE UPDATE ON public.producer_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();