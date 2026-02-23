-- Migration to fix group_members schema and RLS
-- Ensure member_name column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'member_name') THEN
        ALTER TABLE public.group_members ADD COLUMN member_name text;
    END IF;
END $$;

-- Ensure role_in_group column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'role_in_group') THEN
        ALTER TABLE public.group_members ADD COLUMN role_in_group text;
    END IF;
END $$;

-- Update RLS to allow users to apply for membership
-- We first drop the policy if it exists to avoid errors
DROP POLICY IF EXISTS "Users can apply for membership" ON public.group_members;

-- Allow authenticated users to insert a record if:
-- 1. They are inserting their own user_id (matching auth.uid())
-- 2. The status is 'pending' (application)
CREATE POLICY "Users can apply for membership"
ON public.group_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND status = 'pending'
);

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
