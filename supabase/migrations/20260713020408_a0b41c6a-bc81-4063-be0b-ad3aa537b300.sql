
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.rate_limits (
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  window_hour TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, action, window_hour)
);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(_user_id UUID, _action TEXT, _max INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bucket TIMESTAMPTZ := date_trunc('hour', now());
  _current INTEGER;
BEGIN
  INSERT INTO public.rate_limits (user_id, action, window_hour, count)
  VALUES (_user_id, _action, _bucket, 1)
  ON CONFLICT (user_id, action, window_hour)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO _current;
  RETURN _current <= _max;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(UUID, TEXT, INTEGER) FROM PUBLIC, authenticated, anon;
