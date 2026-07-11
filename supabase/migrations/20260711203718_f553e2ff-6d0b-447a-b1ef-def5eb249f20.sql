
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ PLANS ============
CREATE TABLE public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  max_categories int NOT NULL,
  monthly_searches int NOT NULL,
  monthly_saved_leads int NOT NULL,
  detailed_search boolean NOT NULL DEFAULT false,
  price_cents int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

INSERT INTO public.plans (id,name,max_categories,monthly_searches,monthly_saved_leads,detailed_search,price_cents,sort_order) VALUES
  ('gratuito','Gratuito',5,70,100,false,0,1),
  ('starter','Starter',15,300,1000,false,4900,2),
  ('pro','Pro',40,1500,5000,true,9900,3),
  ('business','Business',999,-1,-1,true,19900,4);

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  slug text PRIMARY KEY,
  label text NOT NULL,
  min_plan text NOT NULL REFERENCES public.plans(id) DEFAULT 'gratuito',
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

INSERT INTO public.categories (slug,label,min_plan,sort_order) VALUES
  ('academia','Academia','gratuito',10),
  ('advocacia','Advocacia','gratuito',20),
  ('agencia-marketing','Agência de Marketing','pro',30),
  ('arquitetura','Arquitetura','starter',40),
  ('assistencia-tecnica','Assistência Técnica','gratuito',50),
  ('autoescola','Autoescola','starter',60),
  ('barbearia','Barbearia','gratuito',70),
  ('borracharia','Borracharia','gratuito',80),
  ('buffet','Buffet / Eventos','starter',90),
  ('cafeteria','Cafeteria','gratuito',100),
  ('cartorio','Cartório','pro',110),
  ('chaveiro','Chaveiro','gratuito',120),
  ('clinica-medica','Clínica Médica','pro',130),
  ('clinica-odonto','Clínica Odontológica','pro',140),
  ('concessionaria','Concessionária','pro',150),
  ('confeitaria','Confeitaria','starter',160),
  ('construtora','Construtora','pro',170),
  ('contabilidade','Contabilidade','starter',180),
  ('corretora-imoveis','Corretora de Imóveis','pro',190),
  ('creche','Creche / Escola Infantil','starter',200),
  ('curso-idiomas','Curso de Idiomas','starter',210),
  ('dedetizadora','Dedetizadora','gratuito',220),
  ('dermatologia','Dermatologia','pro',230),
  ('doceria','Doceria','starter',240),
  ('drogaria','Drogaria / Farmácia','pro',250),
  ('eletricista','Eletricista','gratuito',260),
  ('encanador','Encanador','gratuito',270),
  ('escritorio-contabil','Escritório Contábil','starter',280),
  ('estetica','Clínica de Estética','starter',290),
  ('fisioterapia','Fisioterapia','starter',300),
  ('floricultura','Floricultura','gratuito',310),
  ('funeraria','Funerária','pro',320),
  ('hamburgueria','Hamburgueria','starter',330),
  ('hotel','Hotel / Pousada','pro',340),
  ('imobiliaria','Imobiliária','pro',350),
  ('lava-rapido','Lava-Rápido','gratuito',360),
  ('loja-roupas','Loja de Roupas','starter',370),
  ('manicure','Manicure / Salão','gratuito',380),
  ('marcenaria','Marcenaria','starter',390),
  ('mecanica','Mecânica','gratuito',400),
  ('mercado','Mercado / Mercearia','starter',410),
  ('moveis-planejados','Móveis Planejados','pro',420),
  ('nutricionista','Nutricionista','starter',430),
  ('oficina-motos','Oficina de Motos','gratuito',440),
  ('otica','Ótica','starter',450),
  ('padaria','Padaria','gratuito',460),
  ('pet-shop','Pet Shop','starter',470),
  ('pilates-yoga','Pilates / Yoga','starter',480),
  ('pintor','Pintor','gratuito',490),
  ('pizzaria','Pizzaria','starter',500),
  ('psicologia','Psicologia','starter',510),
  ('restaurante','Restaurante','starter',520),
  ('salao-beleza','Salão de Beleza','gratuito',530),
  ('seguradora','Seguradora','pro',540),
  ('sorveteria','Sorveteria','gratuito',550),
  ('tatuagem','Estúdio de Tatuagem','starter',560),
  ('transportadora','Transportadora','pro',570),
  ('veterinaria','Veterinária','starter',580);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.plans(id) DEFAULT 'gratuito',
  renews_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USAGE COUNTERS ============
CREATE TABLE public.usage_counters (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period text NOT NULL,
  searches int NOT NULL DEFAULT 0,
  saved_leads int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period)
);
GRANT SELECT ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============
CREATE POLICY "plans read authenticated" ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "plans admin manage" ON public.plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "categories read authenticated" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories admin manage" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles admin manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "subs self read" ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "subs admin manage" ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "usage self read" ON public.usage_counters FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "usage admin manage" ON public.usage_counters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ TRIGGERS on new user ============
CREATE OR REPLACE FUNCTION public.handle_new_user_plan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_id) VALUES (NEW.id,'gratuito')
    ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_plan ON auth.users;
CREATE TRIGGER on_auth_user_created_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_plan();

-- backfill existing users
INSERT INTO public.subscriptions (user_id, plan_id)
  SELECT id, 'gratuito' FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'user' FROM auth.users ON CONFLICT DO NOTHING;

-- promote the first-registered user to admin (bootstrap)
INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin' FROM auth.users ORDER BY created_at ASC LIMIT 1
  ON CONFLICT DO NOTHING;

-- ============ USAGE / PLAN HELPERS ============
CREATE OR REPLACE FUNCTION public.current_period() RETURNS text
LANGUAGE sql STABLE AS $$ SELECT to_char(now(),'YYYY-MM'); $$;

CREATE OR REPLACE FUNCTION public.increment_usage(_user_id uuid, _searches int, _saved int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.usage_counters (user_id, period, searches, saved_leads)
  VALUES (_user_id, public.current_period(), GREATEST(_searches,0), GREATEST(_saved,0))
  ON CONFLICT (user_id, period) DO UPDATE
    SET searches = public.usage_counters.searches + EXCLUDED.searches,
        saved_leads = public.usage_counters.saved_leads + EXCLUDED.saved_leads,
        updated_at = now();
END; $$;
