-- Security Audit: Remove insecure policies that allow users to INSERT/UPDATE tickets directly.
-- Ticket creation should only be handled by the Edge Functions (Service Role) after payment verification.

-- Drop the policy that allows users to insert tickets
DROP POLICY IF EXISTS "Users can insert their own tickets" ON public.tickets;

-- Ensure no other insecure policies exist (cleanup if any were added manually or via other migrations)
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Anyone can insert tickets" ON public.tickets;

-- Also ensure payments table is secure (only SELECT for own payments was allowed in previous migrations, but explicitly drop potential insecure ones)
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can update payments" ON public.payments;

-- Reload schema cache to apply changes immediately
NOTIFY pgrst, 'reload schema';
