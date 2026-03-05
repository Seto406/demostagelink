-- Phase A foundation for profiles <-> theater_groups normalization
-- Non-breaking, additive migration only.

BEGIN;

-- 1) Add additive membership fields for multi-admin group model
ALTER TABLE IF EXISTS public.group_members
  ADD COLUMN IF NOT EXISTS theater_group_id uuid,
  ADD COLUMN IF NOT EXISTS member_role text NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Keep role values bounded but permissive to current data migration path
DO $$
BEGIN
  IF to_regclass('public.group_members') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'group_members_member_role_check'
        AND conrelid = 'public.group_members'::regclass
    )
  THEN
    ALTER TABLE public.group_members
      ADD CONSTRAINT group_members_member_role_check
      CHECK (member_role IN ('owner', 'admin', 'editor', 'member'));
  END IF;
END $$;

-- 2) Backfill theater_group_id using legacy mapping:
-- legacy group_members.group_id -> profiles.id
-- theater_groups.owner_id -> profiles.id
DO $$
BEGIN
  IF to_regclass('public.group_members') IS NOT NULL
    AND to_regclass('public.theater_groups') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'group_id'
    )
  THEN
    UPDATE public.group_members gm
    SET theater_group_id = tg.id
    FROM public.theater_groups tg
    WHERE gm.group_id = tg.owner_id
      AND gm.theater_group_id IS NULL;
  END IF;
END $$;

-- 3) Add FK after backfill (nullable for compatibility)
DO $$
BEGIN
  IF to_regclass('public.group_members') IS NOT NULL
    AND to_regclass('public.theater_groups') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'group_members_theater_group_id_fkey'
        AND conrelid = 'public.group_members'::regclass
    )
  THEN
    ALTER TABLE public.group_members
      ADD CONSTRAINT group_members_theater_group_id_fkey
      FOREIGN KEY (theater_group_id)
      REFERENCES public.theater_groups(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4) Indexes for expected RLS and dashboard access patterns
CREATE INDEX IF NOT EXISTS group_members_theater_group_id_idx
  ON public.group_members(theater_group_id);

CREATE INDEX IF NOT EXISTS group_members_group_user_status_idx
  ON public.group_members(theater_group_id, user_id, status);

CREATE INDEX IF NOT EXISTS theater_groups_owner_id_idx
  ON public.theater_groups(owner_id);

-- 5) Helper function: auth uid -> profiles.id
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_profile_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated;

-- 6) Helper function: admin/owner authorization check
-- Supports historic group_members.user_id semantics where rows may store either profiles.id or auth.users.id.
CREATE OR REPLACE FUNCTION public.is_group_admin_or_owner(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT p.id AS profile_id, p.user_id AS auth_user_id
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
    LIMIT 1
  )
  SELECT EXISTS (
    SELECT 1
    FROM public.theater_groups tg
    JOIN me ON true
    WHERE tg.id = p_group_id
      AND tg.owner_id = me.profile_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.group_members gm
    JOIN me ON true
    WHERE gm.theater_group_id = p_group_id
      AND gm.status = 'active'
      AND gm.member_role IN ('owner', 'admin')
      AND (gm.user_id = me.profile_id OR gm.user_id = me.auth_user_id)
  );
$$;

REVOKE ALL ON FUNCTION public.is_group_admin_or_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_admin_or_owner(uuid) TO authenticated;

-- 7) Canonical compatibility view for group identity reads
-- Prefers theater_groups fields; falls back to legacy profile group fields.
CREATE OR REPLACE VIEW public.v_group_profile_compat AS
SELECT
  tg.id AS theater_group_id,
  tg.owner_id AS owner_profile_id,
  COALESCE(NULLIF(tg.name, ''), p.group_name) AS group_name,
  COALESCE(NULLIF(tg.description, ''), p.description) AS group_description,
  COALESCE(NULLIF(tg.logo_url, ''), p.group_logo_url) AS group_logo_url,
  COALESCE(NULLIF(tg.banner_url, ''), p.group_banner_url) AS group_banner_url,
  tg.created_at,
  p.user_id AS owner_user_id,
  p.username AS owner_username
FROM public.theater_groups tg
JOIN public.profiles p
  ON p.id = tg.owner_id;

-- 8) Drift report view to monitor migration readiness
CREATE OR REPLACE VIEW public.v_profile_group_drift AS
SELECT
  p.id AS profile_id,
  p.user_id,
  tg.id AS theater_group_id,
  p.group_name AS profile_group_name,
  tg.name AS theater_group_name,
  p.group_logo_url AS profile_group_logo_url,
  tg.logo_url AS theater_group_logo_url,
  p.group_banner_url AS profile_group_banner_url,
  tg.banner_url AS theater_group_banner_url,
  p.description AS profile_description,
  tg.description AS theater_group_description,
  (
    COALESCE(p.group_name, '') IS DISTINCT FROM COALESCE(tg.name, '')
    OR COALESCE(p.group_logo_url, '') IS DISTINCT FROM COALESCE(tg.logo_url, '')
    OR COALESCE(p.group_banner_url, '') IS DISTINCT FROM COALESCE(tg.banner_url, '')
    OR COALESCE(p.description, '') IS DISTINCT FROM COALESCE(tg.description, '')
  ) AS has_drift
FROM public.profiles p
LEFT JOIN public.theater_groups tg
  ON tg.owner_id = p.id
WHERE p.role = 'producer';

COMMIT;
