ALTER TABLE public.shows
ADD COLUMN reservation_fee numeric DEFAULT 0,
ADD COLUMN collect_balance_onsite boolean DEFAULT true;
