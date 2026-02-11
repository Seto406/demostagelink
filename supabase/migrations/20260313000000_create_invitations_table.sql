-- Create the invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    first_name TEXT,
    inviter_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    token UUID DEFAULT gen_random_uuid(),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    accepted_at TIMESTAMP WITH TIME ZONE,
    -- Constraint to prevent duplicate pending invites for the same email
    UNIQUE(email, status)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Only Admins can view/manage all invitations
CREATE POLICY "Admins can manage invitations"
ON public.invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger to update invitation status on user confirmation
CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is confirming their email
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.invitations
    SET status = 'accepted', accepted_at = NEW.email_confirmed_at
    WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users (requires superuser privileges, which migrations have)
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_invitation_acceptance();

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
