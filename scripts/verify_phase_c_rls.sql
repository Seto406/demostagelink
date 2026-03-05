-- Post-apply verification checklist for:
-- supabase/migrations/20260624000000_phase_c_role_based_rls.sql

-- 1) Helper functions present
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_group_editor_or_above',
    'can_manage_group_members'
  )
ORDER BY p.proname;

-- 2) Grants present for authenticated
SELECT
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE specific_schema = 'public'
  AND routine_name IN ('is_group_editor_or_above', 'can_manage_group_members')
ORDER BY routine_name, grantee, privilege_type;

-- 3) Phase C policies present
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (tablename = 'theater_groups' AND policyname = 'Admins can update associated theater groups')
    OR (tablename = 'group_members' AND policyname IN (
      'Group admins can view members by theater_group_id',
      'Group admins can insert members by theater_group_id',
      'Group admins can update members by theater_group_id',
      'Group admins can delete members by theater_group_id'
    ))
  )
ORDER BY tablename, policyname;

-- 4) RLS enabled on target tables
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('theater_groups', 'group_members')
ORDER BY c.relname;

-- 5) Quick summary flags
WITH checks AS (
  SELECT
    EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname='public' AND p.proname='is_group_editor_or_above'
    ) AS has_is_group_editor_or_above,
    EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname='public' AND p.proname='can_manage_group_members'
    ) AS has_can_manage_group_members,
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='theater_groups' AND policyname='Admins can update associated theater groups'
    ) AS has_tg_admin_update_policy,
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='group_members' AND policyname='Group admins can insert members by theater_group_id'
    ) AS has_gm_insert_policy,
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='group_members' AND policyname='Group admins can update members by theater_group_id'
    ) AS has_gm_update_policy,
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='group_members' AND policyname='Group admins can delete members by theater_group_id'
    ) AS has_gm_delete_policy
)
SELECT * FROM checks;
