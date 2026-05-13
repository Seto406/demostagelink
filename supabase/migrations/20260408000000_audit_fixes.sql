-- Migration: Database Audit Fixes
--
-- 1. ORPHAN CHECK: Remove 'membership_applications' table.
--    This table was identified as "dead weight" and is not used in the codebase.
--    Membership requests now go directly to 'group_members' with status 'pending'.
DROP TABLE IF EXISTS membership_applications;

-- 2. SCHEMA ALIGNMENT: Rename 'manual_name' to 'member_name' in 'group_members'.
--    Audit revealed the database column was named 'manual_name' (likely due to a manual change or partial migration),
--    while the codebase consistently expects 'member_name' (as defined in types.ts and usage in Dashboard/ProducerProfile).
--    Renaming ensures the application correctly accesses this field and prevents runtime errors.
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='group_members' AND column_name='manual_name') THEN
    ALTER TABLE group_members RENAME COLUMN manual_name TO member_name;
  END IF;
END $$;

-- 3. PERFORMANCE LEAKS: Add missing indices.
--    Audit identified missing indices on foreign keys in 'group_members' and 'collaboration_requests',
--    which could lead to performance issues as data grows.
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_collaboration_requests_sender_id ON collaboration_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_receiver_id ON collaboration_requests(receiver_id);

-- 4. RELATIONSHIP INTEGRITY NOTE:
--    The request to "Verify that the group_name in the profiles table... correctly maps to the corresponding ID in the theater_groups table"
--    could not be fulfilled as 'theater_groups' table DOES NOT EXIST.
--    Groups are represented as records in the 'profiles' table with role='producer'.
--    The 'group_name' field in 'profiles' is the source of truth.
--    This note is for documentation purposes.
