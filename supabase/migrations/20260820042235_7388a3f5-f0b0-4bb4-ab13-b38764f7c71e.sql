CREATE TABLE IF NOT EXISTS public.site_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  path TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.site_events TO anon, authenticated;
GRANT SELECT ON public.site_events TO authenticated;
GRANT ALL ON public.site_events TO service_role;

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a site event"
  ON public.site_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view site events"
  ON public.site_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS site_events_name_idx ON public.site_events(event_name, created_at DESC);