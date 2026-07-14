CREATE TABLE public.site_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  verification_token text NOT NULL DEFAULT ('lume-verify-' || encode(gen_random_bytes(16),'hex')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','failed')),
  verified_at timestamptz,
  last_checked_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX site_domains_site_id_idx ON public.site_domains(site_id);
CREATE INDEX site_domains_domain_idx ON public.site_domains(domain);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_domains TO authenticated;
GRANT SELECT ON public.site_domains TO anon;
GRANT ALL ON public.site_domains TO service_role;

ALTER TABLE public.site_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their site domains"
  ON public.site_domains FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_domains.site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_domains.site_id AND s.user_id = auth.uid()));

CREATE POLICY "Public can resolve verified domains"
  ON public.site_domains FOR SELECT
  TO anon
  USING (status = 'verified');

CREATE TRIGGER update_site_domains_updated_at
  BEFORE UPDATE ON public.site_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();