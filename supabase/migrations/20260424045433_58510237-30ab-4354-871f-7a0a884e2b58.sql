-- Add bank details to profiles (one bank per user, locked after save, admin can edit)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS bank_locked BOOLEAN NOT NULL DEFAULT false;

-- Prevent users from updating bank fields once locked (admins bypass)
CREATE OR REPLACE FUNCTION public.protect_locked_bank_details()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If admin, allow anything
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- If currently locked, block changes to bank fields
  IF COALESCE(OLD.bank_locked, false) = true THEN
    IF NEW.bank_account_number IS DISTINCT FROM OLD.bank_account_number
       OR NEW.bank_ifsc_code IS DISTINCT FROM OLD.bank_ifsc_code
       OR NEW.bank_name IS DISTINCT FROM OLD.bank_name
       OR NEW.bank_account_holder IS DISTINCT FROM OLD.bank_account_holder
       OR NEW.bank_locked IS DISTINCT FROM OLD.bank_locked THEN
      RAISE EXCEPTION 'Bank details are locked. Contact admin to change them.';
    END IF;
  END IF;

  -- If user is filling for first time, auto-lock
  IF (OLD.bank_account_number IS NULL OR OLD.bank_account_number = '')
     AND NEW.bank_account_number IS NOT NULL AND NEW.bank_account_number <> '' THEN
    NEW.bank_locked := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_bank_details ON public.profiles;
CREATE TRIGGER protect_bank_details
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_locked_bank_details();

-- Extend withdrawal_status enum to add 'processing' (Pending -> Processing -> Success/Rejected)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'processing'
      AND enumtypid = 'public.withdrawal_status'::regtype
  ) THEN
    ALTER TYPE public.withdrawal_status ADD VALUE 'processing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'success'
      AND enumtypid = 'public.withdrawal_status'::regtype
  ) THEN
    ALTER TYPE public.withdrawal_status ADD VALUE 'success';
  END IF;
END$$;

-- Add UTR and snapshot of bank details to withdrawals
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS utr_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;