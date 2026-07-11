
-- ENUMs
CREATE TYPE public.lead_status AS ENUM ('base','abordado','agendado','follow_up','convertido','perdido');
CREATE TYPE public.lead_tier AS ENUM ('frio','morno','quente');
CREATE TYPE public.appointment_status AS ENUM ('pendente','concluido','cancelado');

-- LEADS
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  country text DEFAULT 'Brasil',
  state text,
  city text,
  address text,
  phone text,
  email text,
  website text,
  has_website boolean NOT NULL DEFAULT false,
  score int NOT NULL DEFAULT 0,
  tier public.lead_tier NOT NULL DEFAULT 'frio',
  status public.lead_status NOT NULL DEFAULT 'base',
  source text,
  notes text,
  rating numeric,
  reviews_count int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners select leads" ON public.leads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update leads" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete leads" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_leads_user_status ON public.leads(user_id, status);
CREATE INDEX idx_leads_user_created ON public.leads(user_id, created_at DESC);
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  notes text,
  location text,
  starts_at timestamptz NOT NULL,
  duration_min int NOT NULL DEFAULT 30,
  status public.appointment_status NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners select appts" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert appts" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update appts" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete appts" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_appts_user_starts ON public.appointments(user_id, starts_at);
CREATE TRIGGER trg_appts_updated BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SITE SUBMISSIONS (lead capture from published sites)
CREATE TABLE public.site_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_submissions TO authenticated;
GRANT INSERT ON public.site_submissions TO anon;
GRANT ALL ON public.site_submissions TO service_role;
ALTER TABLE public.site_submissions ENABLE ROW LEVEL SECURITY;

-- anyone can insert into submissions for a PUBLISHED site
CREATE POLICY "Anyone submits to published sites" ON public.site_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.published = true));

-- site owner can read/delete
CREATE POLICY "Owner reads submissions" ON public.site_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()));
CREATE POLICY "Owner deletes submissions" ON public.site_submissions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()));

CREATE INDEX idx_subs_site_created ON public.site_submissions(site_id, created_at DESC);
