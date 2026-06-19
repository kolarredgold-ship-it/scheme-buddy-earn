
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_credits integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance
     OR NEW.report_credits IS DISTINCT FROM OLD.report_credits
     OR NEW.ai_credits IS DISTINCT FROM OLD.ai_credits
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'You cannot modify wallet balance, credits, subscription status, or referral fields.';
  END IF;
  RETURN NEW;
END;
$function$;

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
         SET subscription_status = 'active', updated_at = now()
       WHERE user_id = NEW.user_id;
    ELSIF NEW.payment_type IN ('topup', 'ai_topup') THEN
      UPDATE public.profiles
         SET ai_credits = ai_credits + 3, updated_at = now()
       WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
