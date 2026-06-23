
-- 1. payment_logs: audit trail for Razorpay
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  event TEXT NOT NULL,          -- e.g. 'order.created','verify.success','verify.fail','webhook.payment.captured'
  status TEXT NOT NULL,          -- 'success' | 'failed' | 'pending'
  amount NUMERIC,
  payment_type TEXT,
  error_message TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_logs TO authenticated;
GRANT ALL ON public.payment_logs TO service_role;

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payment logs"
  ON public.payment_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS payment_logs_order_idx ON public.payment_logs(razorpay_order_id);
CREATE INDEX IF NOT EXISTS payment_logs_user_idx ON public.payment_logs(user_id);
CREATE INDEX IF NOT EXISTS payment_logs_created_idx ON public.payment_logs(created_at DESC);

-- 2. tool_clicks: engagement analytics
CREATE TABLE IF NOT EXISTS public.tool_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tool_key TEXT NOT NULL,
  source TEXT,                  -- 'home' | 'ai-tools' | 'landing' | etc.
  path TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.tool_clicks TO anon, authenticated;
GRANT SELECT ON public.tool_clicks TO authenticated;
GRANT ALL ON public.tool_clicks TO service_role;

ALTER TABLE public.tool_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a click"
  ON public.tool_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all clicks"
  ON public.tool_clicks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS tool_clicks_tool_idx ON public.tool_clicks(tool_key, created_at DESC);

-- 3. Update credit rules: subscription = 3 ai_credits, topup = 5
CREATE OR REPLACE FUNCTION public.handle_payment_verified()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS DISTINCT FROM 'verified') THEN
    NEW.verified_at := COALESCE(NEW.verified_at, now());
    IF NEW.payment_type = 'subscription' THEN
      UPDATE public.profiles
         SET subscription_status = 'active',
             ai_credits = GREATEST(COALESCE(ai_credits, 0), 3),
             updated_at = now()
       WHERE user_id = NEW.user_id;
    ELSIF NEW.payment_type IN ('topup', 'ai_topup') THEN
      UPDATE public.profiles
         SET ai_credits = COALESCE(ai_credits, 0) + 5,
             updated_at = now()
       WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
