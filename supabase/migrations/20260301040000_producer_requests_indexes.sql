-- Migration: Add indexes to producer_requests table for performance

-- Index on created_at for sorting by date in Admin Panel
CREATE INDEX IF NOT EXISTS producer_requests_created_at_idx ON public.producer_requests(created_at);

-- Index on status for filtering in Admin Panel
CREATE INDEX IF NOT EXISTS producer_requests_status_idx ON public.producer_requests(status);
