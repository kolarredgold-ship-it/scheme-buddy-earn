-- 1) Replay protection table for Airpay callbacks
CREATE TABLE IF NOT EXISTS public.processed_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ap_transaction_id text NOT NULL UNIQUE,
  order_id text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;
-- Only admins can view; service role bypasses RLS for writes from edge function
CREATE POLICY "Admins can view processed payments"
  ON public.processed_payments
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) Remove career_progress from realtime publication (sensitive PII; not needed via realtime)
ALTER PUBLICATION supabase_realtime DROP TABLE public.career_progress;

-- 3) Tighten profile referral exposure: drop broad referral SELECT policy.
--    Referral aggregates can be served via admin/server-side functions; do not expose
--    full PII rows of referred users to upline users.
DROP POLICY IF EXISTS "Users can view profiles of their referrals" ON public.profiles;

-- 4) Explicit restrictive policies on user_roles to prevent privilege escalation,
--    even if a permissive policy is later added by mistake.
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5) Restrict public bucket listing on scheme-images:
--    Allow direct object reads (by URL) but block listing of bucket contents.
--    Strategy: drop overly permissive SELECT policies on storage.objects for this bucket.
--    Public access via CDN URLs continues to work because that path doesn't require RLS.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND cmd='SELECT'
      AND qual ILIKE '%scheme-images%'
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Re-create a SELECT policy limited to admins (listing/metadata access)
CREATE POLICY "Admins can list scheme-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'scheme-images' AND has_role(auth.uid(), 'admin'::app_role));