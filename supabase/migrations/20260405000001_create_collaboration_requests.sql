-- Create table if not exists collaboration_requests
-- This table is used for collaboration requests between users and producers.
-- It is designed to be a simpler alternative to collaboration_logs for emergency fixes.

CREATE TABLE IF NOT EXISTS public.collaboration_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL, -- Can be Auth User ID or Profile ID depending on usage
    receiver_id UUID NOT NULL, -- Usually Profile ID
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT
-- Allow any authenticated user to insert a request.
-- This is critical for the "direct table insert" fix.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'collaboration_requests'
        AND policyname = 'Allow authenticated users to insert requests'
    ) THEN
        CREATE POLICY "Allow authenticated users to insert requests"
        ON public.collaboration_requests
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;
END $$;

-- Policy for SELECT (Sender can view their own requests)
-- Assuming sender_id is the auth.uid() based on "sender_id: user.id" snippet.
-- If sender_id is profile.id, this policy might need adjustment, but for now we prioritize INSERT.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'collaboration_requests'
        AND policyname = 'Allow users to view their own sent requests'
    ) THEN
        CREATE POLICY "Allow users to view their own sent requests"
        ON public.collaboration_requests
        FOR SELECT
        USING (sender_id = auth.uid());
    END IF;
END $$;

-- Policy for SELECT (Receiver can view requests sent to them)
-- Assuming receiver_id is profile.id.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'collaboration_requests'
        AND policyname = 'Allow producers to view requests received'
    ) THEN
        CREATE POLICY "Allow producers to view requests received"
        ON public.collaboration_requests
        FOR SELECT
        USING (receiver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
    END IF;
END $$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_collaboration_requests_updated_at ON public.collaboration_requests;
CREATE TRIGGER update_collaboration_requests_updated_at
BEFORE UPDATE ON public.collaboration_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
