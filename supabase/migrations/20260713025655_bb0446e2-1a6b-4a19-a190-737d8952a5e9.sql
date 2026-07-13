
CREATE TABLE public.site_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX site_events_site_created_idx ON public.site_events (site_id, created_at DESC);
CREATE INDEX site_events_type_idx ON public.site_events (event_type);

GRANT SELECT ON public.site_events TO authenticated;
GRANT INSERT ON public.site_events TO anon, authenticated;
GRANT ALL ON public.site_events TO service_role;

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events on published sites"
  ON public.site_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.published = true)
  );

CREATE POLICY "Site owners can view their events"
  ON public.site_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid())
  );
