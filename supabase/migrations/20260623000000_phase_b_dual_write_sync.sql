-- Phase B: dual-write compatibility layer
-- Goal: keep legacy profile group fields synced from canonical theater_groups writes.
-- Non-breaking: additive trigger/function + backfill update.

BEGIN;

-- 1) Sync function: theater_groups -> profiles legacy group fields
CREATE OR REPLACE FUNCTION public.sync_profile_group_fields_from_theater_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET
    group_name = NEW.name,
    group_logo_url = NEW.logo_url,
    group_banner_url = NEW.banner_url,
    updated_at = now()
  WHERE p.id = NEW.owner_id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_group_fields_from_theater_group() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_profile_group_fields_from_theater_group() TO authenticated;

-- 2) Trigger: keep profiles synced on theater_groups create/update
DROP TRIGGER IF EXISTS sync_profile_group_fields_from_theater_group_trigger ON public.theater_groups;
CREATE TRIGGER sync_profile_group_fields_from_theater_group_trigger
AFTER INSERT OR UPDATE OF name, logo_url, banner_url
ON public.theater_groups
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_group_fields_from_theater_group();

-- 3) One-time backfill from theater_groups into profiles to reduce drift immediately
UPDATE public.profiles p
SET
  group_name = tg.name,
  group_logo_url = tg.logo_url,
  group_banner_url = tg.banner_url,
  updated_at = now()
FROM public.theater_groups tg
WHERE tg.owner_id = p.id
  AND (
    p.group_name IS DISTINCT FROM tg.name
    OR COALESCE(p.group_logo_url, '') IS DISTINCT FROM COALESCE(tg.logo_url, '')
    OR COALESCE(p.group_banner_url, '') IS DISTINCT FROM COALESCE(tg.banner_url, '')
  );

COMMIT;
