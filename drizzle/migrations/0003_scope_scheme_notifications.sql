DROP POLICY IF EXISTS "Signed-in users can view notifications" ON public.scheme_notifications;
CREATE POLICY "Registered users view notifications for their state"
ON public.scheme_notifications FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid())
    AND (
      state = 'central'
      OR NOT EXISTS (
        SELECT 1 FROM public.user_preferences up
        WHERE up.user_id = auth.uid() AND up.preferred_state IS NOT NULL AND up.preferred_state <> 'all'
      )
      OR EXISTS (
        SELECT 1 FROM public.user_preferences up
        WHERE up.user_id = auth.uid() AND up.preferred_state = scheme_notifications.state
      )
    )
  )
);
REVOKE SELECT ON public.scheme_notifications FROM anon;