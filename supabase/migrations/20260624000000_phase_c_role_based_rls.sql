-- Phase C: role-based membership/RLS migration (additive)
-- Goal: shift authorization toward theater_group_id + role-based checks.

BEGIN;

-- 1) Helper: editor/admin/owner check
CREATE OR REPLACE FUNCTION public.is_group_editor_or_above(p_group_id uuid)
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
      AND gm.member_role IN ('owner', 'admin', 'editor')
      AND (gm.user_id = me.profile_id OR gm.user_id = me.auth_user_id)
  );
$$;

REVOKE ALL ON FUNCTION public.is_group_editor_or_above(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_editor_or_above(uuid) TO authenticated;

-- 2) Helper: member-management rights (owner/admin only)
CREATE OR REPLACE FUNCTION public.can_manage_group_members(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_group_admin_or_owner(p_group_id);
$$;

REVOKE ALL ON FUNCTION public.can_manage_group_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_group_members(uuid) TO authenticated;

-- 3) Theater groups update policy for multi-admin model
ALTER TABLE public.theater_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update associated theater groups" ON public.theater_groups;
CREATE POLICY "Admins can update associated theater groups"
ON public.theater_groups
FOR UPDATE
TO authenticated
USING (public.is_group_admin_or_owner(id))
WITH CHECK (public.is_group_admin_or_owner(id));

-- 4) Group members policies on theater_group_id (additive; legacy policies remain for compatibility)
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group admins can view members by theater_group_id" ON public.group_members;
CREATE POLICY "Group admins can view members by theater_group_id"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  theater_group_id IS NOT NULL
  AND public.is_group_editor_or_above(theater_group_id)
);

DROP POLICY IF EXISTS "Group admins can insert members by theater_group_id" ON public.group_members;
CREATE POLICY "Group admins can insert members by theater_group_id"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  theater_group_id IS NOT NULL
  AND public.can_manage_group_members(theater_group_id)
);

DROP POLICY IF EXISTS "Group admins can update members by theater_group_id" ON public.group_members;
CREATE POLICY "Group admins can update members by theater_group_id"
ON public.group_members
FOR UPDATE
TO authenticated
USING (
  theater_group_id IS NOT NULL
  AND public.can_manage_group_members(theater_group_id)
)
WITH CHECK (
  theater_group_id IS NOT NULL
  AND public.can_manage_group_members(theater_group_id)
);

DROP POLICY IF EXISTS "Group admins can delete members by theater_group_id" ON public.group_members;
CREATE POLICY "Group admins can delete members by theater_group_id"
ON public.group_members
FOR DELETE
TO authenticated
USING (
  theater_group_id IS NOT NULL
  AND public.can_manage_group_members(theater_group_id)
);

COMMIT;
