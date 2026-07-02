
-- 1. Per-tool credit balances
CREATE TABLE IF NOT EXISTS public.tool_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_key TEXT NOT NULL,
  credits INT NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_key)
);

GRANT SELECT ON public.tool_credits TO authenticated;
GRANT ALL ON public.tool_credits TO service_role;

ALTER TABLE public.tool_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tool credits"
  ON public.tool_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_tool_credits_updated
  BEFORE UPDATE ON public.tool_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_tool_credits_user ON public.tool_credits(user_id);

-- 2. Canonical tool keys used across the app
CREATE OR REPLACE FUNCTION public.canonical_tool_keys()
RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY[
    'full',                 -- internship report
    'quick',                -- ai report generator
    'mock-interview',
    'live-hr-interview',
    'student:resume-builder',
    'student:cover-letter',
    'student:resume-analyzer',
    'student:career-advisor',
    'student:hr-interview',
    'student:flash-cards',
    'student:sop-generator',
    'student:essay',
    'student:ppt-outline'
  ]::TEXT[];
$$;

-- 3. Atomic consume RPC (used by client via supabase.rpc)
CREATE OR REPLACE FUNCTION public.consume_tool_credit(_tool_key TEXT, _meta JSONB DEFAULT '{}'::jsonb)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _sub TEXT;
  _free_used INT;
  _remaining INT;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'guest');
  END IF;

  SELECT subscription_status INTO _sub FROM public.profiles WHERE user_id = _uid;

  SELECT COUNT(*) INTO _free_used
    FROM public.report_generations
    WHERE user_id = _uid AND report_type = _tool_key;

  IF _sub IS DISTINCT FROM 'active' THEN
    -- Free user: 1 lifetime per tool, no paid credits
    IF _free_used >= 1 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'upgrade', 'remaining', 0);
    END IF;
    INSERT INTO public.report_generations (user_id, report_type, form_data)
      VALUES (_uid, _tool_key, _meta);
    RETURN jsonb_build_object('ok', true, 'source', 'free', 'remaining', 0);
  END IF;

  -- Premium: ensure a row exists, seeded to 3 on first use
  INSERT INTO public.tool_credits (user_id, tool_key, credits)
    VALUES (_uid, _tool_key, 3)
    ON CONFLICT (user_id, tool_key) DO NOTHING;

  -- Atomic decrement guarded by credits > 0
  UPDATE public.tool_credits
     SET credits = credits - 1, updated_at = now()
   WHERE user_id = _uid AND tool_key = _tool_key AND credits > 0
   RETURNING credits INTO _remaining;

  IF _remaining IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'limit_reached', 'remaining', 0);
  END IF;

  INSERT INTO public.report_generations (user_id, report_type, form_data)
    VALUES (_uid, _tool_key, _meta);

  RETURN jsonb_build_object('ok', true, 'source', 'pro', 'remaining', _remaining);
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_tool_credit(TEXT, JSONB) TO authenticated;

-- 4. Replace payment-verified trigger to seed / top up per-tool credits
CREATE OR REPLACE FUNCTION public.handle_payment_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _key TEXT;
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS DISTINCT FROM 'verified') THEN
    NEW.verified_at := COALESCE(NEW.verified_at, now());

    IF NEW.payment_type = 'subscription' THEN
      UPDATE public.profiles
         SET subscription_status = 'active',
             updated_at = now()
       WHERE user_id = NEW.user_id;

      -- Seed / refresh each canonical tool to at least 3 credits
      FOREACH _key IN ARRAY public.canonical_tool_keys() LOOP
        INSERT INTO public.tool_credits (user_id, tool_key, credits)
          VALUES (NEW.user_id, _key, 3)
        ON CONFLICT (user_id, tool_key) DO UPDATE
          SET credits = GREATEST(public.tool_credits.credits, 3),
              updated_at = now();
      END LOOP;

    ELSIF NEW.payment_type IN ('topup', 'ai_topup') THEN
      -- Ensure canonical rows exist first
      FOREACH _key IN ARRAY public.canonical_tool_keys() LOOP
        INSERT INTO public.tool_credits (user_id, tool_key, credits)
          VALUES (NEW.user_id, _key, 0)
        ON CONFLICT (user_id, tool_key) DO NOTHING;
      END LOOP;

      -- Internship report: +3; every other existing tool row: +5
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
$$;

-- 5. Grandfather existing premium users: seed 3/tool now
DO $$
DECLARE
  _u RECORD;
  _key TEXT;
BEGIN
  FOR _u IN SELECT user_id FROM public.profiles WHERE subscription_status = 'active' LOOP
    FOREACH _key IN ARRAY public.canonical_tool_keys() LOOP
      INSERT INTO public.tool_credits (user_id, tool_key, credits)
        VALUES (_u.user_id, _key, 3)
      ON CONFLICT (user_id, tool_key) DO UPDATE
        SET credits = GREATEST(public.tool_credits.credits, 3),
            updated_at = now();
    END LOOP;
  END LOOP;
END $$;
