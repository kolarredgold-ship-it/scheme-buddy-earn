-- Batches table for grouping withdrawals into payout runs
CREATE TABLE IF NOT EXISTS public.withdrawal_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'processing',
  utr_number TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view batches"
ON public.withdrawal_batches FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert batches"
ON public.withdrawal_batches FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update batches"
ON public.withdrawal_batches FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_withdrawal_batches_updated_at
BEFORE UPDATE ON public.withdrawal_batches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link each withdrawal to a batch
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.withdrawal_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_withdrawals_batch_id ON public.withdrawals(batch_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);