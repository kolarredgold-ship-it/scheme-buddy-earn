CREATE OR REPLACE FUNCTION public.referral_code_exists(_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE referral_code = upper(trim(_code))
  );
$$;

GRANT EXECUTE ON FUNCTION public.referral_code_exists(text) TO anon, authenticated;