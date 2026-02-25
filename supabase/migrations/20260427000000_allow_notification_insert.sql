-- Migration: Allow Authenticated Users to Insert Notifications
-- Description: Enables client-side notification creation for membership applications and other user-initiated events.

DO $$
BEGIN
    -- Check if policy already exists to avoid errors
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'notifications'
        AND policyname = 'Authenticated users can insert notifications'
    ) THEN
        CREATE POLICY "Authenticated users can insert notifications"
        ON public.notifications
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;
