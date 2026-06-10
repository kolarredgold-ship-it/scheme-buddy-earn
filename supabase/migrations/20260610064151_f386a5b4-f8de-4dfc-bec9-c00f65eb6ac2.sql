
-- 1) Extend profile protection: block non-admin edits to sensitive fields
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance
     OR NEW.report_credits IS DISTINCT FROM OLD.report_credits
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'You cannot modify wallet balance, report credits, subscription status, or referral fields.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_sensitive_profile_fields ON public.profiles;
CREATE TRIGGER protect_sensitive_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_profile_fields();

-- 2) Explicit admin-only write policies for processed_payments
DROP POLICY IF EXISTS "Only admins can insert processed payments" ON public.processed_payments;
DROP POLICY IF EXISTS "Only admins can update processed payments" ON public.processed_payments;
DROP POLICY IF EXISTS "Only admins can delete processed payments" ON public.processed_payments;

CREATE POLICY "Only admins can insert processed payments"
ON public.processed_payments FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update processed payments"
ON public.processed_payments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete processed payments"
ON public.processed_payments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Storage policies: admin delete/update for payment screenshots
DROP POLICY IF EXISTS "Admins can delete payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update payment screenshots" ON storage.objects;

CREATE POLICY "Admins can delete payment screenshots"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payment screenshots"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 4) Public read for scheme-images (bucket is public, but add explicit listing policy)
DROP POLICY IF EXISTS "Public can read scheme images" ON storage.objects;
CREATE POLICY "Public can read scheme images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'scheme-images');
