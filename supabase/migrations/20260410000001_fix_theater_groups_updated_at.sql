-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to theater_groups if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'theater_groups' AND column_name = 'updated_at') THEN
        ALTER TABLE public.theater_groups ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
    END IF;
END $$;

-- Create trigger for automatic timestamp updates on theater_groups
DROP TRIGGER IF EXISTS update_theater_groups_updated_at ON public.theater_groups;
CREATE TRIGGER update_theater_groups_updated_at
BEFORE UPDATE ON public.theater_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
