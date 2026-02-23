-- Ensure actor_id exists in notifications table
DO $$
BEGIN
    -- Add column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'actor_id'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN actor_id UUID;
    END IF;

    -- Add constraint if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'notifications_actor_id_fkey'
    ) THEN
        ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_actor_id_fkey
        FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Reload schema cache to ensure PostgREST picks up the new column
NOTIFY pgrst, 'reload config';
