DROP POLICY IF EXISTS "Anyone can view notifications" ON public.scheme_notifications;
CREATE POLICY "Signed-in users can view notifications" ON public.scheme_notifications
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can record a site event" ON public.site_events;
CREATE POLICY "Visitors can record allowed site events" ON public.site_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND event_name IN ('signup_completed','payment_completed','investors_page_view')
    AND (source IS NULL OR length(source) <= 100)
    AND (path IS NULL OR length(path) <= 500)
  );