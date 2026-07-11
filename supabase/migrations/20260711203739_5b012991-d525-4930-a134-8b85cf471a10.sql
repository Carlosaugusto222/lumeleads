
CREATE OR REPLACE FUNCTION public.current_period() RETURNS text
LANGUAGE sql STABLE SET search_path = public AS $$ SELECT to_char(now(),'YYYY-MM'); $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_plan() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_usage(uuid,int,int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
-- has_role must remain callable so RLS policies can evaluate it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
