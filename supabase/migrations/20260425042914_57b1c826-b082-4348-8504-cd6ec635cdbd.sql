CREATE UNIQUE INDEX IF NOT EXISTS uniq_withdrawal_batches_utr
  ON public.withdrawal_batches (utr_number)
  WHERE utr_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_withdrawals_utr
  ON public.withdrawals (utr_number)
  WHERE utr_number IS NOT NULL;