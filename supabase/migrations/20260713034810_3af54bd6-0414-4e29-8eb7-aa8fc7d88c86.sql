
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  cycle TEXT NOT NULL DEFAULT 'monthly',
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  mp_preapproval_id TEXT,
  init_point TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payments_user_idx ON public.payments(user_id);
CREATE INDEX payments_mp_payment_idx ON public.payments(mp_payment_id);
CREATE INDEX payments_mp_preference_idx ON public.payments(mp_preference_id);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payments" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all payments" ON public.payments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.mp_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT,
  resource_id TEXT,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.mp_webhook_logs TO service_role;
ALTER TABLE public.mp_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read webhook logs" ON public.mp_webhook_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
