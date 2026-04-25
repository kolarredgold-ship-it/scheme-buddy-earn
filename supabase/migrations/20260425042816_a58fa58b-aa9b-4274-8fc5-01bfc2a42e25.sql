-- Trigger: on withdrawal insert -> debit wallet + create debit transaction
CREATE OR REPLACE FUNCTION public.handle_withdrawal_wallet_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT wallet_balance INTO current_balance FROM public.profiles WHERE user_id = NEW.user_id FOR UPDATE;
    IF current_balance IS NULL THEN
      RAISE EXCEPTION 'Profile not found for user';
    END IF;
    IF current_balance < NEW.amount THEN
      RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;

    UPDATE public.profiles
       SET wallet_balance = wallet_balance - NEW.amount,
           updated_at = now()
     WHERE user_id = NEW.user_id;

    INSERT INTO public.transactions (user_id, amount, type, source)
    VALUES (NEW.user_id, NEW.amount, 'debit', 'Withdrawal Request');

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Refund on transition to rejected (from any non-rejected status)
    IF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected' THEN
      UPDATE public.profiles
         SET wallet_balance = wallet_balance + NEW.amount,
             updated_at = now()
       WHERE user_id = NEW.user_id;

      INSERT INTO public.transactions (user_id, amount, type, source)
      VALUES (NEW.user_id, NEW.amount, 'credit', 'Withdrawal Rejected - Refund');
    END IF;

    -- Re-debit if a previously rejected withdrawal is reactivated
    IF OLD.status = 'rejected' AND NEW.status IS DISTINCT FROM 'rejected' THEN
      SELECT wallet_balance INTO current_balance FROM public.profiles WHERE user_id = NEW.user_id FOR UPDATE;
      IF current_balance < NEW.amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance to re-activate withdrawal';
      END IF;
      UPDATE public.profiles
         SET wallet_balance = wallet_balance - NEW.amount,
             updated_at = now()
       WHERE user_id = NEW.user_id;
      INSERT INTO public.transactions (user_id, amount, type, source)
      VALUES (NEW.user_id, NEW.amount, 'debit', 'Withdrawal Re-activated');
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- If the withdrawal wasn't rejected, refund on delete
    IF OLD.status <> 'rejected' THEN
      UPDATE public.profiles
         SET wallet_balance = wallet_balance + OLD.amount,
             updated_at = now()
       WHERE user_id = OLD.user_id;
      INSERT INTO public.transactions (user_id, amount, type, source)
      VALUES (OLD.user_id, OLD.amount, 'credit', 'Withdrawal Deleted - Refund');
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_withdrawal_wallet_insert ON public.withdrawals;
CREATE TRIGGER trg_withdrawal_wallet_insert
BEFORE INSERT ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.handle_withdrawal_wallet_sync();

DROP TRIGGER IF EXISTS trg_withdrawal_wallet_update ON public.withdrawals;
CREATE TRIGGER trg_withdrawal_wallet_update
AFTER UPDATE OF status ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.handle_withdrawal_wallet_sync();

DROP TRIGGER IF EXISTS trg_withdrawal_wallet_delete ON public.withdrawals;
CREATE TRIGGER trg_withdrawal_wallet_delete
BEFORE DELETE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.handle_withdrawal_wallet_sync();