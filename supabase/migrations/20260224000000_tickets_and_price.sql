-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, used
    payment_id UUID REFERENCES public.payments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Producers can view tickets for their shows
CREATE POLICY "Producers can view tickets for their shows" ON public.tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.shows
            WHERE shows.id = tickets.show_id
            AND shows.producer_id = auth.uid()
        )
    );

-- Add price column to shows
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
