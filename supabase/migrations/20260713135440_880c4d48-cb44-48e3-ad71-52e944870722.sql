
-- Enum for template channel
CREATE TYPE public.followup_channel AS ENUM ('whatsapp','email');
CREATE TYPE public.followup_task_status AS ENUM ('pending','sent','cancelled','failed');

-- Templates
CREATE TABLE public.follow_up_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel public.followup_channel NOT NULL,
  trigger_status public.lead_status NOT NULL,
  delay_hours integer NOT NULL DEFAULT 24 CHECK (delay_hours >= 0 AND delay_hours <= 24*90),
  subject text,
  body text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_templates TO authenticated;
GRANT ALL ON public.follow_up_templates TO service_role;
ALTER TABLE public.follow_up_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own templates" ON public.follow_up_templates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_ft_updated BEFORE UPDATE ON public.follow_up_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_ft_user_trigger ON public.follow_up_templates(user_id, trigger_status) WHERE enabled;

-- Tasks
CREATE TABLE public.follow_up_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.follow_up_templates(id) ON DELETE SET NULL,
  channel public.followup_channel NOT NULL,
  subject text,
  body text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status public.followup_task_status NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_tasks TO authenticated;
GRANT ALL ON public.follow_up_tasks TO service_role;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own tasks" ON public.follow_up_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_fk_updated BEFORE UPDATE ON public.follow_up_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_fk_pending ON public.follow_up_tasks(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_fk_user_status ON public.follow_up_tasks(user_id, status, scheduled_for);
