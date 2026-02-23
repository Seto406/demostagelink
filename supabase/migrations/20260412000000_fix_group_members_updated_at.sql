-- Fix group_members updated_at schema issue

-- 1. Ensure updated_at column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'updated_at') THEN
        ALTER TABLE public.group_members ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
    END IF;
END $$;

-- 2. Ensure trigger function exists (it should, but good to be safe)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for automatic timestamp updates on group_members
DROP TRIGGER IF EXISTS update_group_members_updated_at ON public.group_members;
CREATE TRIGGER update_group_members_updated_at
BEFORE UPDATE ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Force schema cache reload to resolve PGRST204
NOTIFY pgrst, 'reload config';
