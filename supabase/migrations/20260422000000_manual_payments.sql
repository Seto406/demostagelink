-- Migration to support Manual Payments (QR Code + Screenshot)

-- 1. Modify payments table
ALTER TABLE public.payments ALTER COLUMN paymongo_checkout_id DROP NOT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'paymongo';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS proof_of_payment_url TEXT;

-- 2. Create system_settings table for dynamic configuration (e.g. Admin QR Code)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies for system_settings
CREATE POLICY "Public read access to system settings" ON public.system_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update system settings" ON public.system_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert system settings" ON public.system_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Insert default QR code setting placeholder
INSERT INTO public.system_settings (key, value, description)
VALUES ('payment_qr_code_url', NULL, 'URL of the GCash/Bank QR Code image')
ON CONFLICT (key) DO NOTHING;

-- 3. Storage Buckets (Upsert)
-- Attempt to insert buckets if they don't exist.
-- Note: usage of storage.buckets requires appropriate permissions or extensions.
-- If this fails in some environments, it must be done via Dashboard.
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('system_assets', 'system_assets', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policies

-- DROP existing policies to ensure idempotency if re-run (optional but safe)
DROP POLICY IF EXISTS "Public Access System Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload System Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update System Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete System Assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admin view all proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users view own proofs" ON storage.objects;

-- system_assets (Public Read, Admin Write)
CREATE POLICY "Public Access System Assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'system_assets');

CREATE POLICY "Admin Upload System Assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'system_assets' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin Update System Assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'system_assets' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin Delete System Assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'system_assets' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- payment_proofs (Public Insert, Admin Read)
-- We allow ANYONE to upload to payment_proofs (so guests can upload screenshots).
-- We do NOT allow public select (private bucket).
CREATE POLICY "Anyone can upload payment proofs" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'payment_proofs');

-- Read access: Admin
CREATE POLICY "Admin view all proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment_proofs' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Read access: Owner (User)
-- Authenticated users should see their own uploads
CREATE POLICY "Users view own proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment_proofs' AND
        auth.uid() = owner
    );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
