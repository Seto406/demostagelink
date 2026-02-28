CREATE OR REPLACE FUNCTION public.approve_show_edit_request(request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    req RECORD;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT *
    INTO req
    FROM public.show_edit_requests
    WHERE id = request_id AND status = 'pending';

    IF req IS NULL THEN
        RAISE EXCEPTION 'Request not found or not pending';
    END IF;

    UPDATE public.shows AS s
    SET
        title = COALESCE(p.title, s.title),
        description = COALESCE(p.description, s.description),
        date = COALESCE(p.date, s.date),
        show_time = COALESCE(p.show_time, s.show_time),
        venue = COALESCE(p.venue, s.venue),
        city = COALESCE(p.city, s.city),
        niche = COALESCE(p.niche, s.niche),
        ticket_link = COALESCE(p.ticket_link, s.ticket_link),
        external_links = COALESCE(p.external_links, s.external_links),
        price = COALESCE(p.price, s.price),
        poster_url = COALESCE(p.poster_url, s.poster_url),
        reservation_fee = COALESCE(p.reservation_fee, s.reservation_fee),
        collect_balance_onsite = COALESCE(p.collect_balance_onsite, s.collect_balance_onsite),
        genre = COALESCE(p.genre, s.genre),
        director = COALESCE(p.director, s.director),
        duration = COALESCE(p.duration, s.duration),
        tags = COALESCE(p.tags, s.tags),
        cast_members = COALESCE(p.cast_members, s.cast_members),
        seo_metadata = COALESCE(p.seo_metadata, s.seo_metadata),
        production_status = COALESCE(p.production_status, s.production_status),
        updated_at = now()
    FROM jsonb_populate_record(NULL::public.shows, req.changes) AS p
    WHERE s.id = req.show_id;

    UPDATE public.show_edit_requests
    SET status = 'approved', updated_at = now()
    WHERE id = request_id;
END;
$$;
