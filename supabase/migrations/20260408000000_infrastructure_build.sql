-- Create theater_groups table
CREATE TABLE IF NOT EXISTS public.theater_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    owner_id uuid REFERENCES public.profiles(id) NOT NULL,
    description text,
    logo_url text,
    banner_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add status column to group_members if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'status') THEN
        ALTER TABLE public.group_members ADD COLUMN status text DEFAULT 'active';
    END IF;
END $$;

-- Migrate existing producers to theater_groups
INSERT INTO public.theater_groups (name, owner_id, description, logo_url, banner_url, created_at, updated_at)
SELECT
    group_name,
    id as owner_id,
    description,
    group_logo_url as logo_url,
    group_banner_url as banner_url,
    created_at,
    updated_at
FROM public.profiles
WHERE role = 'producer' AND group_name IS NOT NULL
ON CONFLICT DO NOTHING; -- Assuming no unique constraint on name yet, but good practice

-- Migrate membership_applications to group_members
INSERT INTO public.group_members (group_id, user_id, status, created_at, updated_at, member_name)
SELECT
    ma.group_id,
    ma.user_id,
    ma.status,
    ma.created_at,
    now(),
    COALESCE(p.username, 'Unknown User')
FROM public.membership_applications ma
LEFT JOIN public.profiles p ON ma.user_id = p.id
ON CONFLICT (group_id, user_id) DO UPDATE
SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;

-- Add RLS policies for theater_groups (basic)
ALTER TABLE public.theater_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.theater_groups FOR SELECT USING (true);
CREATE POLICY "Users can insert their own theater_groups." ON public.theater_groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own theater_groups." ON public.theater_groups FOR UPDATE USING (auth.uid() = owner_id);
