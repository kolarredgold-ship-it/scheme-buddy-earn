-- Allow users to view profiles of people they referred
CREATE POLICY "Users can view profiles of their referrals"
ON public.profiles
FOR SELECT
USING (
  referred_by IN (
    SELECT referral_code FROM public.profiles WHERE user_id = auth.uid()
  )
);
