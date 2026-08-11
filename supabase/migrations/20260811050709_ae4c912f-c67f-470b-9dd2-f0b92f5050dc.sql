ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Backfill existing active subscribers: 1 year from their latest verified subscription payment, else from profile creation
UPDATE public.profiles p
   SET subscription_expires_at = COALESCE(
        (SELECT max(pay.verified_at) FROM public.payments pay
          WHERE pay.user_id = p.user_id AND pay.status = 'verified' AND pay.payment_type = 'subscription'),
        p.created_at
      ) + interval '1 year'
 WHERE p.subscription_status = 'active' AND p.subscription_expires_at IS NULL;

CREATE OR REPLACE FUNCTION public.handle_payment_verified()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _key TEXT;
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS DISTINCT FROM 'verified') THEN
    NEW.verified_at := COALESCE(NEW.verified_at, now());

    IF NEW.payment_type = 'subscription' THEN
      UPDATE public.profiles
         SET subscription_status = 'active',
             -- Renew early: stack onto remaining time; otherwise start from now
             subscription_expires_at = GREATEST(COALESCE(subscription_expires_at, now()), now()) + interval '1 year',
             updated_at = now()
       WHERE user_id = NEW.user_id;

      FOREACH _key IN ARRAY public.canonical_tool_keys() LOOP
        INSERT INTO public.tool_credits (user_id, tool_key, credits)
          VALUES (NEW.user_id, _key, 3)
        ON CONFLICT (user_id, tool_key) DO UPDATE
          SET credits = GREATEST(public.tool_credits.credits, 3),
              updated_at = now();
      END LOOP;

    ELSIF NEW.payment_type IN ('topup', 'ai_topup') THEN
      FOREACH _key IN ARRAY public.canonical_tool_keys() LOOP
        INSERT INTO public.tool_credits (user_id, tool_key, credits)
          VALUES (NEW.user_id, _key, 0)
        ON CONFLICT (user_id, tool_key) DO NOTHING;
      END LOOP;

      UPDATE public.tool_credits
         SET credits = credits + CASE
              WHEN tool_key IN ('full', 'internship_report') THEN 3
              ELSE 5
            END,
             updated_at = now()
       WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Allow the trigger-driven expiry field to change without tripping the protection trigger,
-- while still blocking users from editing it directly.
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
     OR NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'You cannot modify wallet balance, credits, subscription status, or referral fields.';
  END IF;
  RETURN NEW;
END;
$function$;

-- Marks lapsed subscriptions as expired. Runs as owner so it bypasses the protection trigger.
CREATE OR REPLACE FUNCTION public.expire_lapsed_subscriptions()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _count INT;
BEGIN
  UPDATE public.profiles
     SET subscription_status = 'expired',
         updated_at = now()
   WHERE subscription_status = 'active'
     AND subscription_expires_at IS NOT NULL
     AND subscription_expires_at < now();
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$function$;

REVOKE ALL ON FUNCTION public.expire_lapsed_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_lapsed_subscriptions() TO service_role;