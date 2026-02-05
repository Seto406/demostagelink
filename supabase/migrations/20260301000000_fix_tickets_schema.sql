-- Migration: Fix tickets and payments schema to consistently use Auth ID (via profiles.user_id)
-- This aligns tickets and payments and enables correct RLS and edge function logic.

-- ============================================================================
-- 1. PAYMENTS TABLE CORRECTION
-- ============================================================================

-- Ensure FK references profiles(user_id) (Auth ID) instead of profiles(id).
-- We first drop the existing FK constraint to allow updating the values.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

-- Update data: Convert Profile IDs to Auth IDs if necessary.
-- We join with profiles on profiles.id = payments.user_id and set payments.user_id = profiles.user_id.
-- This handles rows where user_id is currently a Profile ID.
UPDATE public.payments p
SET user_id = prof.user_id
FROM public.profiles prof
WHERE p.user_id = prof.id;

-- Re-add the Foreign Key constraint pointing to profiles(user_id)
ALTER TABLE public.payments
ADD CONSTRAINT payments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

-- Ensure RLS policy is correct (auth.uid() = user_id)
DROP POLICY IF EXISTS "View own payments" ON public.payments;
CREATE POLICY "View own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);


-- ============================================================================
-- 2. TICKETS TABLE CORRECTION
-- ============================================================================

-- Ensure payment_id column exists (referencing payments)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'payment_id') THEN
        ALTER TABLE public.tickets ADD COLUMN payment_id UUID REFERENCES public.payments(id);
    END IF;
END $$;

-- Migrate user_id from Profile ID to Auth ID (User ID)
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;

-- Update data: Convert Profile IDs to Auth IDs.
UPDATE public.tickets t
SET user_id = p.user_id
FROM public.profiles p
WHERE t.user_id = p.id;

-- Re-add the Foreign Key constraint pointing to profiles(user_id)
ALTER TABLE public.tickets
ADD CONSTRAINT tickets_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

-- Fix status column to be flexible (remove old check constraints if any)
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE public.tickets ALTER COLUMN status SET DEFAULT 'confirmed';
ALTER TABLE public.tickets ALTER COLUMN status TYPE text;

-- Re-apply RLS policies
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;

CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Producer policy
DROP POLICY IF EXISTS "Producers can view tickets for their shows" ON public.tickets;

CREATE POLICY "Producers can view tickets for their shows" ON public.tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.shows
            WHERE shows.id = tickets.show_id
            AND shows.producer_id IN (
                SELECT id FROM public.profiles WHERE user_id = auth.uid()
            )
        )
    );
