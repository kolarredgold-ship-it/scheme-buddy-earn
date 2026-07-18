
CREATE OR REPLACE FUNCTION public.validate_payment_amount_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can insert/adjust freely (e.g. manual corrections)
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.currency IS DISTINCT FROM 'INR' THEN
    RAISE EXCEPTION 'Unsupported currency: %', NEW.currency;
  END IF;

  IF NEW.payment_type = 'subscription' THEN
    IF NEW.amount <> 999 THEN
      RAISE EXCEPTION 'Invalid amount for subscription: expected 999, got %', NEW.amount;
    END IF;
  ELSIF NEW.payment_type IN ('topup', 'ai_topup') THEN
    IF NEW.amount <> 499 THEN
      RAISE EXCEPTION 'Invalid amount for %: expected 499, got %', NEW.payment_type, NEW.amount;
    END IF;
  ELSE
    RAISE EXCEPTION 'Unknown payment_type: %', NEW.payment_type;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_validate_amount ON public.payments;
CREATE TRIGGER trg_payments_validate_amount
BEFORE INSERT OR UPDATE OF amount, payment_type, currency ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.validate_payment_amount_type();
