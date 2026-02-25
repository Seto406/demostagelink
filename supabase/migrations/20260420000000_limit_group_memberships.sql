-- Migration to limit users to joining at most 2 theater groups
-- Enforces limit on INSERT into group_members

CREATE OR REPLACE FUNCTION public.check_membership_limit()
RETURNS TRIGGER AS $$
DECLARE
  membership_count INTEGER;
BEGIN
  -- Count existing active or pending memberships for the user
  SELECT COUNT(*)
  INTO membership_count
  FROM public.group_members
  WHERE user_id = NEW.user_id
    AND status IN ('active', 'pending');

  -- Allow the insert only if count is less than 2
  IF membership_count >= 2 THEN
    RAISE EXCEPTION 'You can only join up to 2 theater groups.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS check_membership_limit_trigger ON public.group_members;

CREATE TRIGGER check_membership_limit_trigger
BEFORE INSERT ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.check_membership_limit();
