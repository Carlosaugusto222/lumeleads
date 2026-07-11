import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlanRow = {
  id: string;
  name: string;
  max_categories: number;
  monthly_searches: number;
  monthly_saved_leads: number;
  detailed_search: boolean;
  price_cents: number;
  sort_order: number;
};

export type CategoryRow = {
  slug: string;
  label: string;
  min_plan: string;
  active: boolean;
  sort_order: number;
};

const PLAN_RANK: Record<string, number> = { gratuito: 1, starter: 2, pro: 3, business: 4 };

export const getMyPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const period = new Date().toISOString().slice(0, 7);

    const [subRes, planListRes, catsRes, usageRes, roleRes] = await Promise.all([
      supabase.from("subscriptions").select("plan_id").eq("user_id", userId).maybeSingle(),
      supabase.from("plans").select("*").order("sort_order"),
      supabase.from("categories").select("*").eq("active", true).order("sort_order"),
      supabase.from("usage_counters").select("*").eq("user_id", userId).eq("period", period).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const planId = subRes.data?.plan_id ?? "gratuito";
    const plans = (planListRes.data ?? []) as PlanRow[];
    const plan = plans.find((p) => p.id === planId) ?? plans.find((p) => p.id === "gratuito")!;
    const categories = (catsRes.data ?? []) as CategoryRow[];
    const rank = PLAN_RANK[plan.id] ?? 1;
    const allowed = categories.filter((c) => (PLAN_RANK[c.min_plan] ?? 1) <= rank);
    const usage = usageRes.data ?? { searches: 0, saved_leads: 0 };
    const roles = (roleRes.data ?? []).map((r) => r.role as string);

    return {
      plan,
      plans,
      categories,
      allowedSlugs: allowed.map((c) => c.slug),
      usage: { searches: usage.searches ?? 0, saved_leads: usage.saved_leads ?? 0 },
      period,
      isAdmin: roles.includes("admin"),
      roles,
    };
  });
