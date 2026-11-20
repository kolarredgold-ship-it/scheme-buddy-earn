CREATE OR REPLACE FUNCTION public.require_pro_for_topup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.payment_type IN ('topup', 'ai_topup', 'report_credits') AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = NEW.user_id AND subscription_status = 'active'
      AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
  ) THEN
    RAISE EXCEPTION 'Activate Pro for ₹999 before purchasing credit top-ups.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.require_pro_for_topup() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_pro_before_topup ON public.payments;
CREATE TRIGGER enforce_pro_before_topup
BEFORE INSERT OR UPDATE OF status, payment_type, user_id ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.require_pro_for_topup();