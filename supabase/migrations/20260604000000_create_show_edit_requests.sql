
-- 1. Create the `show_edit_requests` table
CREATE TABLE IF NOT EXISTS public.show_edit_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
    producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    changes JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.show_edit_requests ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Producers can view their own requests
CREATE POLICY "Producers can view own edit requests" ON public.show_edit_requests
    FOR SELECT
    USING (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Producers can insert their own requests
CREATE POLICY "Producers can insert own edit requests" ON public.show_edit_requests
    FOR INSERT
    WITH CHECK (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Producers can update their own pending requests (e.g. correct a typo before approval)
CREATE POLICY "Producers can update own pending edit requests" ON public.show_edit_requests
    FOR UPDATE
    USING (
        producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND
        status = 'pending'
    );

-- Admins can view all requests
CREATE POLICY "Admins can view all edit requests" ON public.show_edit_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Admins can update all requests (approve/reject)
CREATE POLICY "Admins can update all edit requests" ON public.show_edit_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 4. Create RPC Function to Approve Request
CREATE OR REPLACE FUNCTION public.approve_show_edit_request(request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    req RECORD;
    target_show_id UUID;
    show_changes JSONB;
BEGIN
    -- Check if admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get the request
    SELECT * INTO req FROM public.show_edit_requests WHERE id = request_id AND status = 'pending';

    IF req IS NULL THEN
        RAISE EXCEPTION 'Request not found or not pending';
    END IF;

    target_show_id := req.show_id;
    show_changes := req.changes;

    -- Update the show with the changes
    -- We construct a dynamic update using jsonb_populate_record is tricky if schema changes,
    -- so we'll do a direct JSONB update where possible or map keys manually.
    -- Ideally, the frontend sends a full object or partial object matching the table columns.
    -- For simplicity and robustness, let's assume 'changes' contains keys matching column names.

    -- Using jsonb_to_record is hard without a type, so we'll iterate known columns or use a loop?
    -- No, let's use the jsonb_populate_record logic but we need a target row type.
    -- Better yet, let's just update the specific fields we expect producers to edit.

    UPDATE public.shows
    SET
        title = COALESCE((show_changes->>'title'), title),
        description = COALESCE((show_changes->>'description'), description),
        date = COALESCE((show_changes->>'date'), date),
        show_time = COALESCE((show_changes->>'show_time'), show_time),
        venue = COALESCE((show_changes->>'venue'), venue),
        city = COALESCE((show_changes->>'city'), city),
        niche = COALESCE((show_changes->>'niche')::public.niche_type, niche),
        ticket_link = COALESCE((show_changes->>'ticket_link'), ticket_link),
        external_links = COALESCE((show_changes->>'external_links'), external_links),
        price = COALESCE((show_changes->>'price')::numeric, price),
        poster_url = COALESCE((show_changes->>'poster_url'), poster_url),
        reservation_fee = COALESCE((show_changes->>'reservation_fee')::numeric, reservation_fee),
        collect_balance_onsite = COALESCE((show_changes->>'collect_balance_onsite')::boolean, collect_balance_onsite),
        genre = COALESCE((show_changes->>'genre'), genre),
        director = COALESCE((show_changes->>'director'), director),
        duration = COALESCE((show_changes->>'duration'), duration),
        tags = COALESCE(
            (SELECT array_agg(x) FROM jsonb_array_elements_text(show_changes->'tags') t(x)),
            tags
        ),
        cast_members = COALESCE((show_changes->'cast_members'), cast_members),
        seo_metadata = COALESCE((show_changes->'seo_metadata'), seo_metadata),
        production_status = COALESCE((show_changes->>'production_status'), production_status),
        updated_at = now()
    WHERE id = target_show_id;

    -- Mark request as approved
    UPDATE public.show_edit_requests
    SET status = 'approved', updated_at = now()
    WHERE id = request_id;

END;
$$;

-- 5. Create RPC Function to Reject Request
CREATE OR REPLACE FUNCTION public.reject_show_edit_request(request_id UUID, feedback TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Update request status
    UPDATE public.show_edit_requests
    SET status = 'rejected', admin_feedback = feedback, updated_at = now()
    WHERE id = request_id;

END;
$$;

-- Grant Execute
GRANT EXECUTE ON FUNCTION public.approve_show_edit_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_show_edit_request(UUID, TEXT) TO authenticated;
