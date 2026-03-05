-- Post-apply verification checklist for:
-- supabase/migrations/20260622000000_phase_a_group_model_foundation.sql
--
-- Usage examples:
--   psql "$DATABASE_URL" -f scripts/verify_phase_a_group_model.sql
--   supabase db remote commit --db-url "$DATABASE_URL"  # then run the file manually in SQL editor

-- 1) Confirm additive columns exist on group_members
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'group_members'
  AND column_name IN ('theater_group_id', 'member_role', 'permissions')
ORDER BY column_name;

-- 2) Confirm constraints exist
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE c.conrelid = 'public.group_members'::regclass
  AND conname IN (
    'group_members_member_role_check',
    'group_members_theater_group_id_fkey'
  )
ORDER BY conname;

-- 3) Confirm indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname = 'group_members_theater_group_id_idx'
    OR indexname = 'group_members_group_user_status_idx'
    OR indexname = 'theater_groups_owner_id_idx'
  )
ORDER BY indexname;

-- 4) Backfill coverage snapshot
-- NOTE: null theater_group_id may still be expected for rows without a resolvable legacy mapping.
SELECT
  COUNT(*) AS total_group_members,
  COUNT(*) FILTER (WHERE theater_group_id IS NOT NULL) AS with_theater_group_id,
  COUNT(*) FILTER (WHERE theater_group_id IS NULL) AS without_theater_group_id
FROM public.group_members;

-- 5) Explain unresolved mappings (legacy-compatible diagnostic)
SELECT
  gm.id AS group_member_id,
  gm.group_id AS legacy_group_profile_id,
  gm.user_id,
  gm.status,
  gm.member_role,
  gm.created_at
FROM public.group_members gm
LEFT JOIN public.theater_groups tg
  ON tg.owner_id = gm.group_id
WHERE gm.theater_group_id IS NULL
ORDER BY gm.created_at DESC
LIMIT 100;

-- 6) Function existence + security mode + grants
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prosecdef AS security_definer,
  pg_get_userbyid(p.proowner) AS owner
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('current_profile_id', 'is_group_admin_or_owner')
ORDER BY p.proname;

SELECT
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE specific_schema = 'public'
  AND routine_name IN ('current_profile_id', 'is_group_admin_or_owner')
ORDER BY routine_name, grantee, privilege_type;

-- 7) View existence + row visibility
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('v_group_profile_compat', 'v_profile_group_drift')
ORDER BY table_name;

SELECT COUNT(*) AS compat_rows FROM public.v_group_profile_compat;
SELECT COUNT(*) AS drift_rows FROM public.v_profile_group_drift;
SELECT COUNT(*) AS drift_true_rows FROM public.v_profile_group_drift WHERE has_drift;

-- 8) Optional quick functional probe for current session user
-- Returns true if session has admin/owner rights to at least one mapped theater group.
-- Safe to run even with empty data.
WITH one_group AS (
  SELECT theater_group_id
  FROM public.v_group_profile_compat
  LIMIT 1
)
SELECT
  og.theater_group_id,
  public.is_group_admin_or_owner(og.theater_group_id) AS can_admin
FROM one_group og;

-- 9) Summary status flags for quick human scan
WITH checks AS (
  SELECT
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='group_members' AND column_name='theater_group_id'
    ) AS has_theater_group_id,
    EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname='group_members_member_role_check' AND conrelid='public.group_members'::regclass
    ) AS has_role_check,
    EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname='group_members_theater_group_id_fkey' AND conrelid='public.group_members'::regclass
    ) AS has_group_fk,
    EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='current_profile_id'
    ) AS has_current_profile_id,
    EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='is_group_admin_or_owner'
    ) AS has_is_group_admin_or_owner,
    EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema='public' AND table_name='v_group_profile_compat'
    ) AS has_compat_view,
    EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema='public' AND table_name='v_profile_group_drift'
    ) AS has_drift_view
)
SELECT * FROM checks;

-- 10) Phase B dual-write objects (safe if not yet applied)
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'sync_profile_group_fields_from_theater_group';

SELECT
  t.tgname AS trigger_name,
  c.relname AS table_name,
  pg_get_triggerdef(t.oid) AS trigger_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'theater_groups'
  AND t.tgname = 'sync_profile_group_fields_from_theater_group_trigger'
  AND NOT t.tgisinternal;
