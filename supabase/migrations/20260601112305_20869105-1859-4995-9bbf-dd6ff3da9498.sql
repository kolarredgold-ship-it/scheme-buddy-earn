
-- Revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated.
-- These functions are used internally (in RLS policies or triggers) and should
-- not be callable directly via the Data API.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_referral_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_scheme_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_withdrawal_wallet_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_locked_bank_details() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
