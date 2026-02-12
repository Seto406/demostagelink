-- Create collaboration_logs table
CREATE TABLE IF NOT EXISTS public.collaboration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collaboration_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Sender can view their own sent logs
CREATE POLICY "Sender can view own sent logs"
ON public.collaboration_logs
FOR SELECT
USING (sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Recipient can view logs sent to them
CREATE POLICY "Recipient can view logs sent to them"
ON public.collaboration_logs
FOR SELECT
USING (recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Admins can view all logs
CREATE POLICY "Admins can view all logs"
ON public.collaboration_logs
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_collaboration_logs_updated_at
BEFORE UPDATE ON public.collaboration_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
