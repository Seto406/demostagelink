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
    -- We check if the key EXISTS in the JSON using the ? operator.
    -- If it exists, we take the value (even if it is null).
    -- If it doesn't exist, we keep the original column value.
    -- Casting is crucial.

    UPDATE public.shows
    SET
        title = CASE WHEN show_changes ? 'title' THEN (show_changes->>'title') ELSE title END,
        description = CASE WHEN show_changes ? 'description' THEN (show_changes->>'description') ELSE description END,
        date = CASE WHEN show_changes ? 'date' THEN (show_changes->>'date') ELSE date END,
        show_time = CASE WHEN show_changes ? 'show_time' THEN (show_changes->>'show_time') ELSE show_time END,
        venue = CASE WHEN show_changes ? 'venue' THEN (show_changes->>'venue') ELSE venue END,
        city = CASE WHEN show_changes ? 'city' THEN (show_changes->>'city') ELSE city END,
        niche = CASE WHEN show_changes ? 'niche' THEN (show_changes->>'niche')::public.niche_type ELSE niche END,
        ticket_link = CASE WHEN show_changes ? 'ticket_link' THEN (show_changes->>'ticket_link') ELSE ticket_link END,
        external_links = CASE WHEN show_changes ? 'external_links' THEN (show_changes->'external_links') ELSE external_links END,
        price = CASE WHEN show_changes ? 'price' THEN (show_changes->>'price')::numeric ELSE price END,
        poster_url = CASE WHEN show_changes ? 'poster_url' THEN (show_changes->>'poster_url') ELSE poster_url END,
        reservation_fee = CASE WHEN show_changes ? 'reservation_fee' THEN (show_changes->>'reservation_fee')::numeric ELSE reservation_fee END,
        collect_balance_onsite = CASE WHEN show_changes ? 'collect_balance_onsite' THEN (show_changes->>'collect_balance_onsite')::boolean ELSE collect_balance_onsite END,
        genre = CASE WHEN show_changes ? 'genre' THEN (show_changes->>'genre') ELSE genre END,
        director = CASE WHEN show_changes ? 'director' THEN (show_changes->>'director') ELSE director END,
        duration = CASE WHEN show_changes ? 'duration' THEN (show_changes->>'duration') ELSE duration END,
        tags = CASE
            WHEN show_changes ? 'tags' THEN
                (SELECT array_agg(x) FROM jsonb_array_elements_text(show_changes->'tags') t(x))
            ELSE tags
        END,
        cast_members = CASE WHEN show_changes ? 'cast_members' THEN (show_changes->'cast_members') ELSE cast_members END,
        seo_metadata = CASE WHEN show_changes ? 'seo_metadata' THEN (show_changes->'seo_metadata') ELSE seo_metadata END,
        production_status = CASE WHEN show_changes ? 'production_status' THEN (show_changes->>'production_status') ELSE production_status END,
        updated_at = now()
    WHERE id = target_show_id;

    -- Mark request as approved
    UPDATE public.show_edit_requests
    SET status = 'approved', updated_at = now()
    WHERE id = request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_show_edit_request(UUID) TO authenticated;
