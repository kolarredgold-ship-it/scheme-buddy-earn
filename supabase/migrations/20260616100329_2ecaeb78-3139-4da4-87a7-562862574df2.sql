
-- Restrict processed_payments SELECT to authenticated admins only
DROP POLICY IF EXISTS "Admins can view processed payments" ON public.processed_payments;
CREATE POLICY "Admins can view processed payments"
ON public.processed_payments
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enforce status='pending' on user-created withdrawals
DROP POLICY IF EXISTS "Users can request withdrawals" ON public.withdrawals;
CREATE POLICY "Users can request withdrawals"
ON public.withdrawals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');
