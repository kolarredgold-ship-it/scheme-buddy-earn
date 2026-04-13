-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles of their referrals" ON public.profiles;

-- Create a security definer function to get user's referral code without hitting RLS
CREATE OR REPLACE FUNCTION public.get_user_referral_code(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT referral_code FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Recreate the policy using the function
CREATE POLICY "Users can view profiles of their referrals"
ON public.profiles
FOR SELECT
USING (referred_by = public.get_user_referral_code(auth.uid()));